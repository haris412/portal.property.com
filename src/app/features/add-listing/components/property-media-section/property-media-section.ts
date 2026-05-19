import { ChangeDetectionStrategy, Component, Input, OnDestroy, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';
import { UploadDropzoneData } from '../../../../core/models/ui.models';
import { PROPERTY_MEDIA_BLOCK_IDS } from '../../constants/add-listing.constants';
import { TranslateModule } from '@ngx-translate/core';

interface MediaBlock extends UploadDropzoneData {
  id: string;
  label: string;
}

interface SelectedImagePreview {
  name: string;
  url: string;
  file: File;
}

@Component({
  selector: 'app-property-media-section',
  imports: [TranslateModule, SectionCardComponent, UploadDropzoneComponent, MatIconModule],
  templateUrl: './property-media-section.html',
  styleUrl: './property-media-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyMediaSectionComponent implements OnDestroy {
  @Input({ required: true }) form!: FormGroup;

  readonly PROPERTY_MEDIA_BLOCK_IDS = PROPERTY_MEDIA_BLOCK_IDS;
  readonly selectedImagePreviews = signal<SelectedImagePreview[]>([]);
  readonly selectedVideoName = signal<string | null>(null);

  readonly mediaBlocks = signal<MediaBlock[]>([
    {
      id: 'photos',
      label: 'Photos',
      title: 'Click to upload or drag & drop',
      subtitle: 'SVG, PNG, JPG (max. 10MB)',
      icon: 'image',
      accept: '.svg,.png,.jpg,.jpeg'
    },
    {
      id: 'video',
      label: 'Video Tour',
      title: 'Click to upload or drag & drop',
      subtitle: 'MP4, WebM or MOV (max. 100MB)',
      icon: 'videocam',
      accept: '.mp4,.webm,.mov'
    }
  ]);

  onFilesSelected(blockId: string, files: File[]): void {
    const normalizedBlockId = blockId.toLowerCase();

    if (normalizedBlockId === PROPERTY_MEDIA_BLOCK_IDS.PHOTOS) {
      const nextPreviews = [...this.selectedImagePreviews()];
      const existingKeys = new Set(nextPreviews.map((item) => this.fileKey(item.file)));
      for (const file of files) {
        const key = this.fileKey(file);
        if (existingKeys.has(key)) {
          continue;
        }
        existingKeys.add(key);
        nextPreviews.push({
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        });
      }
      this.syncImages(nextPreviews);
    } else if (normalizedBlockId === PROPERTY_MEDIA_BLOCK_IDS.VIDEO) {
      this.form.get('videoFiles')?.setValue(files);
      this.selectedVideoName.set(files[0]?.name ?? null);
    }
  }

  ngOnDestroy(): void {
    this.revokeImagePreviews();
  }

  removeSelectedImage(index: number): void {
    const previews = this.selectedImagePreviews();
    const target = previews[index];
    if (!target) {
      return;
    }

    URL.revokeObjectURL(target.url);
    const nextPreviews = previews.filter((_, i) => i !== index);
    this.syncImages(nextPreviews);
  }

  private revokeImagePreviews(): void {
    for (const preview of this.selectedImagePreviews()) {
      URL.revokeObjectURL(preview.url);
    }
  }

  private syncImages(previews: SelectedImagePreview[]): void {
    this.selectedImagePreviews.set(previews);
    const ctrl = this.form.get('images');
    ctrl?.setValue(previews.map((item) => item.file));
    ctrl?.markAsTouched();
  }

  private fileKey(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }
}
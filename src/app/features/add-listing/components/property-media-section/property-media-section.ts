import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';
import { UploadDropzoneData } from '../../../../core/models/ui.models';
import { PROPERTY_MEDIA_BLOCK_IDS } from '../../constants/add-listing.constants';

interface MediaBlock extends UploadDropzoneData {
  id: string;
  label: string;
}

@Component({
  selector: 'app-property-media-section',
  imports: [SectionCardComponent, UploadDropzoneComponent],
  templateUrl: './property-media-section.html',
  styleUrl: './property-media-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyMediaSectionComponent {
  @Input({ required: true }) form!: FormGroup;

  readonly PROPERTY_MEDIA_BLOCK_IDS = PROPERTY_MEDIA_BLOCK_IDS;

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
      this.form.get('images')?.setValue(files);
    } else if (normalizedBlockId === PROPERTY_MEDIA_BLOCK_IDS.VIDEO) {
      this.form.get('videoFiles')?.setValue(files);
    }
  }
}
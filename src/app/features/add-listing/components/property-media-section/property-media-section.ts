import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ListingImagePayload, MediaUploadService } from '../../../../core/services/media-upload.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';

interface NewImagePreview {
  name: string;
  url: string;
  file: File;
}

@Component({
  selector: 'app-property-media-section',
  imports: [TranslateModule, SectionCardComponent, UploadDropzoneComponent, MatIconModule],
  templateUrl: './property-media-section.html',
  styleUrl: './property-media-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyMediaSectionComponent implements OnDestroy {
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  @Input({ required: true }) form!: FormGroup;
  @Input() existingImages: ListingImagePayload[] = [];
  @Input() existingVideoUrl: string | null = null;
  @Output() readonly existingImageRemoved = new EventEmitter<number>();

  readonly newImagePreviews = signal<NewImagePreview[]>([]);
  readonly selectedVideoName = signal<string | null>(null);
  readonly deletingImageUrls = signal(new Set<string>());

  ngOnDestroy(): void {
    for (const preview of this.newImagePreviews()) {
      URL.revokeObjectURL(preview.url);
    }
  }

  onPhotosSelected(files: File[]): void {
    const current = this.newImagePreviews();
    const seenKeys = new Set(current.map((p) => this.fileKey(p.file)));
    const additions: NewImagePreview[] = [];

    for (const file of files) {
      const key = this.fileKey(file);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      additions.push({ name: file.name, url: URL.createObjectURL(file), file });
    }

    if (additions.length) {
      this.syncNewImages([...current, ...additions]);
    }
  }

  onVideoSelected(files: File[]): void {
    this.form.get('videoFiles')?.setValue(files);
    this.selectedVideoName.set(files[0]?.name ?? null);
  }

  async removeExistingImage(index: number): Promise<void> {
    const image = this.existingImages[index];
    if (!image || this.deletingImageUrls().has(image.url)) return;

    const confirmed = await firstValueFrom(
      this.confirmationDialog.confirm({
        title: 'Remove Image',
        message: 'Are you sure you want to remove this image? This cannot be undone.',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        tone: 'warn',
        icon: 'delete',
      })
    );
    if (!confirmed) return;

    this.deletingImageUrls.update((set) => new Set(set).add(image.url));
    try {
      await this.mediaUploadService.deleteImage(image.url);
      this.existingImageRemoved.emit(index);
    } catch {
      this.notifications.error('Failed to remove image. Please try again.');
    } finally {
      this.deletingImageUrls.update((set) => {
        const next = new Set(set);
        next.delete(image.url);
        return next;
      });
    }
  }

  removeNewImage(index: number): void {
    const previews = this.newImagePreviews();
    const target = previews[index];
    if (!target) return;
    URL.revokeObjectURL(target.url);
    this.syncNewImages(previews.filter((_, i) => i !== index));
  }

  private syncNewImages(previews: NewImagePreview[]): void {
    this.newImagePreviews.set(previews);
    this.form.get('images')?.setValue(previews.map((p) => p.file));
    this.form.markAsTouched();
  }

  private fileKey(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }
}

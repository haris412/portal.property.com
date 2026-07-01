import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ListingImagePayload, MediaUploadService } from '../../../../core/services/media-upload.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';
import type { UploadedMediaPayload } from '../../mappers/listing-payload.mapper';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';

function mediaRequirementValidator(control: AbstractControl): ValidationErrors | null {
  const images = (control.get('images')?.value as File[] | null) ?? [];
  const video  = (control.get('videoFiles')?.value as File[] | null) ?? [];
  return images.length >= 3 || video.length > 0 ? null : { mediaRequired: true };
}

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
export class PropertyMediaSectionComponent implements OnInit, OnDestroy {
  private readonly fb                 = inject(FormBuilder);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly notifications      = inject(NotificationService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  @Input() existingImages:  ListingImagePayload[] = [];
  @Input() existingVideoUrl: string | null = null;
  @Input() propertyId:       string | null = null;

  @Output() readonly formReady            = new EventEmitter<FormGroup>();
  @Output() readonly existingImageRemoved = new EventEmitter<number>();

  readonly form    = this.fb.nonNullable.group(
    { images: [[] as File[]], videoFiles: [[] as File[]] },
    { validators: mediaRequirementValidator }
  );
  readonly isValid = toSignal(this.form.statusChanges.pipe(startWith(this.form.status), map(s => s === 'VALID')), { initialValue: this.form.valid });

  readonly newImagePreviews = signal<NewImagePreview[]>([]);
  readonly selectedVideoName = signal<string | null>(null);
  readonly deletingImageUrls = signal(new Set<string>());

  ngOnInit(): void {
    this.formReady.emit(this.form);
  }

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

  async uploadForCreate(): Promise<UploadedMediaPayload> {
    const images     = (this.form.value.images     ?? []) as File[];
    const videoFiles = (this.form.value.videoFiles ?? []) as File[];
    const pid        = this.propertyId ?? undefined;

    if (!images.length && !videoFiles.length) return { images: [], videoTourUrl: null };

    this.notifications.info('Uploading media...');
    try {
      const urls         = images.length ? await this.mediaUploadService.uploadImages(images, pid) : [];
      const videoTourUrl = videoFiles[0]  ? await this.mediaUploadService.uploadVideo(videoFiles[0], pid) : null;
      if (urls.length < images.length) this.notifications.warning(`${images.length - urls.length} image(s) failed to upload.`);
      else this.notifications.success('Media uploaded successfully');
      return { images: this.toPayload(urls), videoTourUrl };
    } catch (error: unknown) {
      const details = apiErrorSummary(error) || 'Media upload failed';
      this.notifications.error(details);
      throw new Error(details);
    }
  }

  async uploadForEdit(): Promise<UploadedMediaPayload> {
    const images     = (this.form.value.images     ?? []) as File[];
    const videoFiles = (this.form.value.videoFiles ?? []) as File[];
    const pid        = this.propertyId ?? undefined;

    let uploadedNewImages: ListingImagePayload[] = [];
    let videoTourUrl = (this.existingVideoUrl || null) as string | null;

    if (images.length || videoFiles.length) {
      this.notifications.info('Uploading media...');
      try {
        const urls = images.length ? await this.mediaUploadService.uploadImages(images, pid) : [];
        if (videoFiles[0]) videoTourUrl = await this.mediaUploadService.uploadVideo(videoFiles[0], pid);
        if (urls.length < images.length) this.notifications.warning(`${images.length - urls.length} image(s) failed to upload.`);
        else this.notifications.success('Media uploaded successfully');
        uploadedNewImages = this.toPayload(urls);
      } catch (error: unknown) {
        const details = apiErrorSummary(error) || 'Media upload failed';
        this.notifications.error(details);
        throw new Error(details);
      }
    }

    const mergedImages = [...this.existingImages, ...uploadedNewImages].map((img, i) => ({
      ...img, orderIndex: i, isThumbnail: i === 0,
    }));
    return { images: mergedImages, videoTourUrl };
  }

  private toPayload(urls: string[]): ListingImagePayload[] {
    return urls.map((url, i) => ({ url, orderIndex: i, isThumbnail: i === 0 }));
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

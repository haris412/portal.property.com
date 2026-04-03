import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs';
import { AdminAgencyService } from '../../../core/services/admin-agency.service';
import { MediaUploadService } from '../../../core/services/media-upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import { UploadDropzoneComponent } from '../../../shared/ui/upload-dropzone/upload-dropzone';

/** Same cap as property photos on add listing (subtitle: max. 10MB). */
const LOGO_MAX_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-admin-add-agency-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UploadDropzoneComponent,
  ],
  templateUrl: './admin-add-agency-page.component.html',
  styleUrl: './admin-add-agency-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAddAgencyPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly adminAgency = inject(AdminAgencyService);
  private readonly mediaUpload = inject(MediaUploadService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly logoPreviewFailed = signal(false);
  readonly pendingLogoFile = signal<File | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly logoPreviewName = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    contactName: ['', Validators.maxLength(120)],
    contactEmail: ['', [Validators.email, Validators.maxLength(200)]],
    contactPhone: ['', Validators.maxLength(40)],
    location: ['', Validators.maxLength(300)],
  });

  ngOnDestroy(): void {
    this.revokeBlobPreview();
  }

  avatarInitials(name: string | null | undefined): string {
    const n = name?.trim() || '';
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase() || 'AG';
  }

  onLogoPreviewError(): void {
    this.logoPreviewFailed.set(true);
  }

  onLogoFilesSelected(files: File[]): void {
    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notifications.warning('Please choose an image file.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      this.notifications.warning('Image must be 10MB or smaller.');
      return;
    }

    this.revokeBlobPreview();
    this.pendingLogoFile.set(file);
    this.logoPreviewUrl.set(URL.createObjectURL(file));
    this.logoPreviewName.set(file.name);
    this.logoPreviewFailed.set(false);
  }

  removeLogo(): void {
    this.revokeBlobPreview();
    this.pendingLogoFile.set(null);
    this.logoPreviewUrl.set(null);
    this.logoPreviewName.set(null);
    this.logoPreviewFailed.set(false);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    let logoUrl: string | undefined;

    const file = this.pendingLogoFile();
    if (file) {
      try {
        const uploaded = await this.mediaUpload.uploadImages([file]);
        logoUrl = uploaded[0]?.url;
      } catch (err: unknown) {
        this.submitting.set(false);
        this.notifications.error(apiErrorSummary(err));
        return;
      }
    }

    const v = this.form.getRawValue();
    this.adminAgency
      .createAgency({
        name: v.name,
        contactName: v.contactName || undefined,
        contactEmail: v.contactEmail || undefined,
        contactPhone: v.contactPhone || undefined,
        location: v.location || undefined,
        logoUrl,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success('Agency created');
          void this.router.navigate(['/admin/agencies']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.notifications.error(apiErrorSummary(err));
        },
      });
  }

  private revokeBlobPreview(): void {
    const u = this.logoPreviewUrl();
    if (u?.startsWith('blob:')) {
      URL.revokeObjectURL(u);
    }
  }
}

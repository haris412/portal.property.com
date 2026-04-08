import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { take } from 'rxjs';
import { AdminAgencyService } from '../../../core/services/admin-agency.service';
import { MediaUploadService } from '../../../core/services/media-upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import { UploadDropzoneComponent } from '../../../shared/ui/upload-dropzone/upload-dropzone';
import { AgencyContactFormComponent } from '../../components/agency-contact-form/agency-contact-form.component';

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
    MatCardModule,
    UploadDropzoneComponent,
    AgencyContactFormComponent,
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
    location: ['', Validators.maxLength(300)],
    contacts: this.fb.array([this.buildContactGroup(true)]),
  });

  get contacts(): FormArray<FormGroup> {
    return this.form.controls['contacts'] as FormArray<FormGroup>;
  }

  private buildContactGroup(isPrimary = false): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.required, Validators.maxLength(40)]],
      isPrimary: [isPrimary],
    });
  }

  isPrimary(index: number): boolean {
    return !!this.contacts.at(index).get('isPrimary')?.value;
  }

  addContact(): void {
    this.contacts.push(this.buildContactGroup(false));
  }

  removeContact(index: number): void {
    const wasPrimary = this.isPrimary(index);
    this.contacts.removeAt(index);
    if (wasPrimary && this.contacts.length > 0) {
      this.contacts.at(0).get('isPrimary')?.setValue(true);
    }
  }

  onContactMadePrimary(primaryIndex: number): void {
    this.contacts.controls.forEach((group, i) => {
      group.get('isPrimary')?.setValue(i === primaryIndex);
    });
  }

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

    // Guarantee exactly one primary (fallback: first contact)
    const hasPrimary = this.contacts.controls.some(g => !!g.get('isPrimary')?.value);
    if (!hasPrimary) {
      this.contacts.at(0).get('isPrimary')?.setValue(true);
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
        location: v.location || undefined,
        logoUrl,
        contacts: v.contacts.map((c) => ({
          name: (c['name'] as string).trim(),
          email: (c['email'] as string).trim(),
          phone: (c['phone'] as string).trim(),
          isPrimary: !!(c['isPrimary'] as boolean),
        })),
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
    if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
  }
}

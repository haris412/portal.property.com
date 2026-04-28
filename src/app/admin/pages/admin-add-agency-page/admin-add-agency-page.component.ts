import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AdminAgencyService, AgencyContact } from '../../../core/services/admin-agency.service';
import { MediaUploadService } from '../../../core/services/media-upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import { UploadDropzoneComponent } from '../../../shared/ui/upload-dropzone/upload-dropzone';
import { AgencyContactFormComponent } from '../../components/agency-contact-form/agency-contact-form.component';
import { TranslateModule } from '@ngx-translate/core';

const LOGO_MAX_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-admin-add-agency-page',
  standalone: true,
  imports: [
    TranslateModule,
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
  private readonly fb            = inject(FormBuilder);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly adminAgency   = inject(AdminAgencyService);
  private readonly mediaUpload   = inject(MediaUploadService);
  private readonly notifications = inject(NotificationService);

  readonly submitting        = signal(false);
  readonly loadingAgency     = signal(false);
  readonly logoPreviewFailed = signal(false);
  readonly pendingLogoFile   = signal<File | null>(null);
  readonly logoPreviewUrl    = signal<string | null>(null);
  readonly logoPreviewName   = signal<string | null>(null);

  // Signal — reacts when Angular reuses this component across same-route navigations
  readonly isEditMode  = signal(false);
  private editAgencyId    = '';
  private existingLogoUrl = '';

  readonly form = this.fb.nonNullable.group({
    name:     ['', [Validators.required, Validators.maxLength(200)]],
    location: ['', Validators.maxLength(300)],
    contacts: this.fb.array([this.buildContactGroup({ isPrimary: true })]),
  });

  get contacts(): FormArray<FormGroup> {
    return this.form.controls['contacts'] as FormArray<FormGroup>;
  }

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.editAgencyId = params.get('agencyId') ?? '';
      this.isEditMode.set(this.editAgencyId.length > 0);
      this.resetForm();
    });
  }

  ngOnDestroy(): void {
    this.revokeBlobPreview();
  }

  // ── Contact helpers ────────────────────────────────────────────────────────

  isPrimary(index: number): boolean {
    return !!this.contacts.at(index).get('isPrimary')?.value;
  }

  addContact(): void {
    this.contacts.push(this.buildContactGroup());
  }

  removeContact(index: number): void {
    const wasPrimary = this.isPrimary(index);
    this.contacts.removeAt(index);
    if (wasPrimary && this.contacts.length > 0) {
      this.contacts.at(0).get('isPrimary')?.setValue(true);
    }
  }

  onContactMadePrimary(primaryIndex: number): void {
    this.contacts.controls.forEach((g, i) => g.get('isPrimary')?.setValue(i === primaryIndex));
  }

  // ── Logo helpers ───────────────────────────────────────────────────────────

  avatarInitials(name: string | null | undefined): string {
    const parts = (name?.trim() ?? '').split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || 'AG';
  }

  onLogoPreviewError(): void {
    this.logoPreviewFailed.set(true);
  }

  onLogoFilesSelected(files: File[]): void {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.notifications.warning('Please choose an image file.'); return; }
    if (file.size > LOGO_MAX_BYTES)       { this.notifications.warning('Image must be 10MB or smaller.'); return; }
    this.revokeBlobPreview();
    this.pendingLogoFile.set(file);
    this.logoPreviewUrl.set(URL.createObjectURL(file));
    this.logoPreviewName.set(file.name);
    this.logoPreviewFailed.set(false);
  }

  removeLogo(): void {
    this.revokeBlobPreview();
    this.existingLogoUrl = '';
    this.pendingLogoFile.set(null);
    this.logoPreviewUrl.set(null);
    this.logoPreviewName.set(null);
    this.logoPreviewFailed.set(false);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // Guarantee exactly one primary (fallback: first contact)
    if (!this.contacts.controls.some((g) => !!g.get('isPrimary')?.value)) {
      this.contacts.at(0).get('isPrimary')?.setValue(true);
    }

    this.submitting.set(true);

    // Upload new logo if selected, otherwise keep the existing server URL
    let logoUrl: string | undefined = this.existingLogoUrl || undefined;
    const file = this.pendingLogoFile();
    if (file) {
      try {
        logoUrl = (await this.mediaUpload.uploadImages([file]))[0]?.url;
      } catch (err: unknown) {
        this.submitting.set(false);
        this.notifications.error(apiErrorSummary(err));
        return;
      }
    }

    const v = this.form.getRawValue();
    const payload = {
      name:     v.name,
      location: v.location || undefined,
      logoUrl,
      contacts: v.contacts.map((c): AgencyContact => ({
        name:      (c['name']  as string).trim(),
        email:     (c['email'] as string).trim(),
        phone:     (c['phone'] as string).trim(),
        isPrimary: !!(c['isPrimary'] as boolean),
      })),
    };

    const editMode = this.isEditMode();
    const request$ = editMode
      ? this.adminAgency.updateAgency(this.editAgencyId, payload)
      : this.adminAgency.createAgency(payload);

    request$.pipe(take(1)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(editMode ? 'Agency updated' : 'Agency created');
        void this.router.navigate(['/admin/agencies']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.notifications.error(apiErrorSummary(err));
      },
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private resetForm(): void {
    this.removeLogo();
    this.form.reset({ name: '', location: '' }, { emitEvent: false });
    this.contacts.clear({ emitEvent: false });
    this.contacts.push(this.buildContactGroup({ isPrimary: true }), { emitEvent: false });

    if (this.isEditMode()) this.loadAgencyForEdit();
  }

  private loadAgencyForEdit(): void {
    this.loadingAgency.set(true);
    this.adminAgency.getAgencyById(this.editAgencyId).pipe(take(1)).subscribe({
      next: (agency) => {
        this.form.patchValue({ name: agency.name, location: agency.location ?? '' }, { emitEvent: false });

        // Rebuild contacts from API response
        this.contacts.clear({ emitEvent: false });
        const contacts = agency.contacts?.length ? agency.contacts : [{ name: '', email: '', phone: '', isPrimary: true }];
        contacts.forEach((c) => this.contacts.push(this.buildContactGroup(c), { emitEvent: false }));

        // Set existing logo preview
        if (agency.logoUrl) {
          this.existingLogoUrl = agency.logoUrl;
          this.logoPreviewUrl.set(agency.logoUrl);
          this.logoPreviewName.set(`${agency.name} logo`);
          this.logoPreviewFailed.set(false);
        }

        this.loadingAgency.set(false);
      },
      error: (err: unknown) => {
        this.notifications.error(apiErrorSummary(err));
        this.loadingAgency.set(false);
      },
    });
  }

  private buildContactGroup(contact: Partial<AgencyContact> & { isPrimary?: boolean } = {}): FormGroup {
    return this.fb.group({
      name:      [contact.name  ?? '', [Validators.required, Validators.maxLength(120)]],
      email:     [contact.email ?? '', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone:     [contact.phone ?? '', [Validators.required, Validators.maxLength(40)]],
      isPrimary: [contact.isPrimary ?? false],
    });
  }

  private revokeBlobPreview(): void {
    const u = this.logoPreviewUrl();
    if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
  }
}

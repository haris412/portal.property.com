import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, startWith } from 'rxjs';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';
import { WizardStepperComponent, WizardStepperItem } from '../../../../shared/ui/wizard-stepper/wizard-stepper';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { MediaUploadService } from '../../../../core/services/media-upload.service';
import {
  AgentVerificationService,
  MyIdentityVerification,
} from '../../../../core/services/agent-verification.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

type StepKey = 'cnic' | 'face';
type Slot = 'front' | 'back' | 'face';

function formatCnicInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

@Component({
  selector: 'app-account-verification-page',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageShellComponent,
    WizardStepperComponent,
    UploadDropzoneComponent,
    ActionButtonComponent,
    InfoBannerComponent,
  ],
  templateUrl: './account-verification-page.html',
  styleUrl: './account-verification-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountVerificationPageComponent {
  private readonly api = inject(AgentVerificationService);
  private readonly uploads = inject(MediaUploadService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly langChange = toSignal(this.translate.onLangChange.pipe(startWith(null)));

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly record = signal<MyIdentityVerification | null>(null);
  readonly activeStep = signal<StepKey>('cnic');
  readonly cnicNumber = signal('');
  readonly frontFile = signal<File | null>(null);
  readonly backFile = signal<File | null>(null);
  readonly faceFile = signal<File | null>(null);
  readonly frontPreview = signal<string | null>(null);
  readonly backPreview = signal<string | null>(null);
  readonly facePreview = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  readonly readOnly = computed(() => this.record()?.status === 'pending');
  readonly verified = computed(() => this.record()?.status === 'verified');

  readonly cnicReady = computed(() => {
    const digits = this.cnicNumber().replace(/\D/g, '');
    const hasFront = !!this.frontFile() || !!this.record()?.cnicFrontKey || !!this.frontPreview();
    const hasBack = !!this.backFile() || !!this.record()?.cnicBackKey || !!this.backPreview();
    return digits.length === 13 && hasFront && hasBack;
  });

  readonly faceReady = computed(() => !!this.faceFile() || !!this.record()?.facePhotoKey || !!this.facePreview());
  readonly showUrduNotes = computed(() => {
    void this.langChange();
    return this.translate.currentLang !== 'ur';
  });

  readonly steps = computed<WizardStepperItem[]>(() => {
    void this.langChange();
    const onFace = this.activeStep() === 'face';
    const locked = !this.cnicReady() && !this.readOnly();
    return [
      {
        key: 'cnic',
        label: this.translate.instant('verification.steps.cnic'),
        description: this.translate.instant('verification.steps.cnicHint'),
        state: onFace ? 'completed' : 'active',
      },
      {
        key: 'face',
        label: this.translate.instant('verification.steps.face'),
        description: this.translate.instant('verification.steps.faceHint'),
        state: onFace ? 'active' : 'pending',
        disabled: locked,
      },
    ];
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const url of [this.frontPreview(), this.backPreview(), this.facePreview()]) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      }
    });
    void this.load();
  }

  onCnicInput(event: Event): void {
    if (this.readOnly()) return;
    const input = event.target as HTMLInputElement;
    const formatted = formatCnicInput(input.value);
    this.cnicNumber.set(formatted);
    input.value = formatted;
  }

  onStepSelected(key: string): void {
    if (key === 'face' && !this.cnicReady() && !this.readOnly()) {
      this.fileError.set(this.translate.instant('verification.errors.cnicStep'));
      return;
    }
    this.fileError.set(null);
    this.activeStep.set(key === 'face' ? 'face' : 'cnic');
  }

  goNext(): void {
    if (!this.cnicReady()) {
      this.fileError.set(this.translate.instant('verification.errors.cnicStep'));
      return;
    }
    this.fileError.set(null);
    this.activeStep.set('face');
  }

  goBack(): void {
    this.activeStep.set('cnic');
  }

  onFile(slot: Slot, files: File[]): void {
    if (this.readOnly()) return;
    const file = files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      this.fileError.set(this.translate.instant('verification.errors.fileType'));
      return;
    }
    if (file.size > MAX_BYTES) {
      this.fileError.set(this.translate.instant('verification.errors.fileSize'));
      return;
    }
    this.fileError.set(null);
    const preview = URL.createObjectURL(file);
    if (slot === 'front') {
      this.replacePreview(this.frontPreview());
      this.frontFile.set(file);
      this.frontPreview.set(preview);
    } else if (slot === 'back') {
      this.replacePreview(this.backPreview());
      this.backFile.set(file);
      this.backPreview.set(preview);
    } else {
      this.replacePreview(this.facePreview());
      this.faceFile.set(file);
      this.facePreview.set(preview);
    }
  }

  async submit(): Promise<void> {
    if (this.readOnly() || this.submitting()) return;
    if (!this.cnicReady() || !this.faceReady()) {
      this.formError.set(this.translate.instant('verification.errors.incomplete'));
      return;
    }

    this.submitting.set(true);
    this.formError.set(null);
    try {
      const current = this.record();
      const cnicFrontKey = this.frontFile()
        ? await this.uploads.uploadIdentityDocument(this.frontFile()!, 'cnic-front')
        : current?.cnicFrontKey;
      const cnicBackKey = this.backFile()
        ? await this.uploads.uploadIdentityDocument(this.backFile()!, 'cnic-back')
        : current?.cnicBackKey;
      const facePhotoKey = this.faceFile()
        ? await this.uploads.uploadIdentityDocument(this.faceFile()!, 'face')
        : current?.facePhotoKey;

      if (!cnicFrontKey || !cnicBackKey || !facePhotoKey) {
        throw new Error(this.translate.instant('verification.errors.incomplete'));
      }

      const saved = await firstValueFrom(
        this.api.submit({
          cnicNumber: this.cnicNumber(),
          cnicFrontKey,
          cnicBackKey,
          facePhotoKey,
        }),
      );
      this.applyRecord(saved);
      this.notifications.success(this.translate.instant('verification.submitted'));
    } catch (error) {
      const message = error instanceof Error && !('status' in error)
        ? error.message
        : apiErrorSummary(error);
      this.formError.set(message || this.translate.instant('verification.errors.submit'));
    } finally {
      this.submitting.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const record = await firstValueFrom(this.api.getMine());
      this.applyRecord(record);
    } catch (error) {
      this.loadError.set(apiErrorSummary(error) || this.translate.instant('verification.errors.load'));
    } finally {
      this.loading.set(false);
    }
  }

  private applyRecord(record: MyIdentityVerification): void {
    this.record.set(record);
    this.cnicNumber.set(record.cnicNumber ?? '');
    this.frontFile.set(null);
    this.backFile.set(null);
    this.faceFile.set(null);
    this.frontPreview.set(record.images?.cnicFrontUrl ?? null);
    this.backPreview.set(record.images?.cnicBackUrl ?? null);
    this.facePreview.set(record.images?.facePhotoUrl ?? null);
  }

  private replacePreview(current: string | null): void {
    if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom, of, switchMap } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { AuthService } from '../../../../core/services/auth.service';
import { AgentsService } from '../../../../core/services/agents.service';
import { MediaUploadService } from '../../../../core/services/media-upload.service';
import { GooglePlacesService } from '../../../../core/services/google-places.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import type { AgentListItem } from '../../../../core/models/agent.models';
import type { PlaceSuggestion } from '../../../../core/models/google-places.models';
import { UploadDropzoneComponent } from '../../../../shared/ui/upload-dropzone/upload-dropzone';

@Component({
  selector: 'app-add-agent-page',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UploadDropzoneComponent,
    MatCheckboxModule,
    NgxMaterialIntlTelInputComponent,
  ],
  templateUrl: './add-agent-page.html',
  styleUrl: './add-agent-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAgentPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly agentsApi = inject(AgentsService);
  private readonly mediaUpload = inject(MediaUploadService);
  private readonly googlePlaces = inject(GooglePlacesService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly loadingAgent = signal(false);
  readonly isEditMode = signal(false);

  // ── Image upload ─────────────────────────────────────────────────────────────
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  // ── Location autocomplete ─────────────────────────────────────────────────────
  readonly locationSuggestions = signal<PlaceSuggestion[]>([]);
  readonly locationSearchLoading = signal(false);
  private sessionToken = crypto.randomUUID();
  private readonly locationQuery$ = new Subject<string>();

  readonly agencyId = this.auth.getCurrentUser()?.agencyId?.trim() ?? '';
  private editAgentId = '';
  private loadedAgent: AgentListItem | null = null;

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.maxLength(60)]],
    lastName:    ['', [Validators.required, Validators.maxLength(60)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required]],
    location:    ['', [Validators.required]],
    isFeaturedAgent: [false],
  });

  constructor() {
    this.bindLocationSearch();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.editAgentId = params.get('agentId')?.trim() ?? '';
      this.isEditMode.set(this.editAgentId.length > 0);
      this.resetForm();
    });
  }

  ngOnDestroy(): void {
    const url = this.imagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.locationQuery$.complete();
  }

  // ── Computed display values ───────────────────────────────────────────────────

  get userInitials(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    return f ? f.slice(0, 2).toUpperCase() : 'A';
  }

  get fullName(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    return [f, l].filter(Boolean).join(' ') || (this.translate.instant('agents.form.newAgent') as string);
  }

  // ── Image handlers ────────────────────────────────────────────────────────────

  onImageSelected(files: File[]): void {
    const file = files[0];
    if (!file) return;
    const prev = this.imagePreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.selectedImageFile.set(file);
    this.imagePreviewUrl.set(URL.createObjectURL(file));
  }

  removeImage(): void {
    const url = this.imagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
  }

  // ── Location handlers ─────────────────────────────────────────────────────────

  readonly displayLocation = (value: string | null): string => value ?? '';

  onLocationInput(value: string): void {
    this.locationQuery$.next(value.trim());
  }

  onLocationSelected(event: MatAutocompleteSelectedEvent): void {
    const suggestion = event.option.value as PlaceSuggestion;
    this.form.controls.location.setValue(suggestion.mainText, { emitEvent: false });
    this.locationSuggestions.set([]);
    this.sessionToken = crypto.randomUUID();
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async submit(): Promise<void> {
    if (!this.agencyId) {
      this.notifications.error(this.translate.instant('agents.errors.noAgency') as string);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const editMode = this.isEditMode();
    if (!editMode && !this.selectedImageFile()) {
      this.notifications.error(this.translate.instant('agents.form.profileImageRequired') as string);
      return;
    }

    const { firstName, lastName, email, phoneNumber, location, isFeaturedAgent } =
      this.form.getRawValue();

    this.submitting.set(true);
    try {
      const uploadedProfileImageUrl = await this.uploadImageIfSelected();
      const profileImageUrl = uploadedProfileImageUrl ?? this.loadedAgent?.profileImageUrl;

      if (!editMode && !profileImageUrl) {
        this.notifications.error(this.translate.instant('agents.form.profileImageRequired') as string);
        return;
      }

      const normalizedPhone = normalizePhoneNumberForApi(phoneNumber);

      const request$ = editMode
        ? this.agentsApi.updateAgent({
            _id: this.editAgentId,
            agencyId: this.agencyId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: normalizedPhone,
            displayName: this.loadedAgent?.displayName,
            profileImageUrl,
            location: location.trim(),
            isFeaturedAgent,
          })
        : this.agentsApi.createAgent({
            agencyId: this.agencyId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: normalizedPhone,
            location: location.trim(),
            profileImageUrl: profileImageUrl!,
            isFeaturedAgent,
          });

      await firstValueFrom(request$);
      const key = editMode ? 'agents.form.updateSuccess' : 'agents.form.createSuccess';
      this.notifications.success(this.translate.instant(key) as string);
      void this.router.navigate(['/agents']);
    } catch (err: unknown) {
      this.notifications.error(apiErrorSummary(err));
    } finally {
      this.submitting.set(false);
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private async uploadImageIfSelected(): Promise<string | undefined> {
    const file = this.selectedImageFile();
    if (!file) return undefined;
    this.notifications.info('Uploading profile image...');
    const [uploaded] = await this.mediaUpload.uploadImages([file]);
    return uploaded;
  }

  private bindLocationSearch(): void {
    this.locationQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query) {
            this.locationSuggestions.set([]);
            return of([] as PlaceSuggestion[]);
          }
          this.locationSearchLoading.set(true);
          return this.googlePlaces.searchPlaces(query, this.sessionToken).pipe(
            catchError(() => of([] as PlaceSuggestion[]))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        this.locationSearchLoading.set(false);
        this.locationSuggestions.set(results);
      });
  }

  private resetForm(): void {
    this.form.reset({}, { emitEvent: false });
    this.loadedAgent = null;
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);

    if (this.isEditMode()) {
      this.form.controls.email.disable({ emitEvent: false });
      this.loadAgentForEdit();
      return;
    }

    this.form.controls.email.enable({ emitEvent: false });
  }

  private loadAgentForEdit(): void {
    if (!this.editAgentId) return;

    this.loadingAgent.set(true);
    this.agentsApi.getAgentById(this.editAgentId, this.agencyId).pipe(take(1)).subscribe({
      next: (agent) => {
        this.loadedAgent = agent;
        this.form.patchValue({
          firstName:   agent.firstName,
          lastName:    agent.lastName,
          email:       agent.email,
          phoneNumber: agent.phoneNumber ?? '',
          location:    agent.location ?? '',
          isFeaturedAgent: agent.isFeaturedAgent === true,
        });
        if (agent.profileImageUrl) {
          this.imagePreviewUrl.set(agent.profileImageUrl);
        }
        this.loadingAgent.set(false);
      },
      error: (err: unknown) => {
        this.loadingAgent.set(false);
        this.notifications.error(apiErrorSummary(err));
        void this.router.navigate(['/agents']);
      },
    });
  }
}

/** Strips formatting so API receives `+` plus 10–15 digits only. */
function normalizePhoneNumberForApi(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

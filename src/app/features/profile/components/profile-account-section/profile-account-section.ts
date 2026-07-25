import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnDestroy,
  Output,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, take } from 'rxjs';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import type { GooglePlacePrediction, PlaceSuggestion } from '../../../../core/models/google-places.models';
import { UserProfileModel } from '../../../../core/models/profile.models';
import { AuthService } from '../../../../core/services/auth.service';
import { GooglePlacesService } from '../../../../core/services/google-places.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService, UpdateUserPayload } from '../../../../core/services/user.service';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-account-section',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ActionButtonComponent,
  ],
  templateUrl: './profile-account-section.html',
  styleUrl: './profile-account-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAccountSection implements OnDestroy {
  private readonly fb            = inject(FormBuilder);
  private readonly userService   = inject(UserService);
  private readonly auth          = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly googlePlaces  = inject(GooglePlacesService);
  private readonly destroyRef    = inject(DestroyRef);

  readonly profile = input.required<UserProfileModel>();
  readonly saving  = signal(false);

  @Output() readonly saved = new EventEmitter<Partial<UserProfileModel>>();

  // ── Location autocomplete ───────────────────────────────────────────────────
  readonly locationSuggestions   = signal<GooglePlacePrediction[]>([]);
  readonly locationSearchLoading = signal(false);
  private sessionToken           = crypto.randomUUID();
  private readonly locationQuery$ = new Subject<string>();

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.maxLength(60)]],
    lastName:    ['', [Validators.required, Validators.maxLength(60)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    location:    ['', Validators.maxLength(200)],
  });

  constructor() {
    effect(() => {
      const p = this.profile();
      this.form.patchValue({
        firstName:   p.firstName ?? '',
        lastName:    p.lastName  ?? '',
        phoneNumber: p.phone     ?? '',
        location:    p.location  ?? '',
      }, { emitEvent: false });
    });

    this.bindLocationSearch();
  }

  ngOnDestroy(): void {
    this.locationQuery$.complete();
  }

  // ── Location handlers ───────────────────────────────────────────────────────

  readonly displayLocation = (value: string | null): string => value ?? '';

  onLocationInput(value: string): void {
    this.locationQuery$.next(value.trim());
  }

  onLocationSelected(event: MatAutocompleteSelectedEvent): void {
    const suggestion = event.option.value as GooglePlacePrediction;
    this.form.controls.location.setValue(suggestion.structuredFormat.mainText.text, { emitEvent: false });
    this.locationSuggestions.set([]);
    this.sessionToken = crypto.randomUUID();
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.profile().id;
    if (!id) return;

    const { firstName, lastName, phoneNumber, location } = this.form.getRawValue();
    const payload: UpdateUserPayload = {
      firstName:   firstName.trim(),
      lastName:    lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      location:    location.trim() || undefined,
    };

    this.saving.set(true);
    this.userService.updateUser(id, payload)
      .pipe(take(1))
      .subscribe({
        next: (updatedUser) => {
          this.saving.set(false);
          this.notifications.success('Profile updated successfully');
          this.saved.emit({
            firstName: updatedUser.firstName,
            lastName:  updatedUser.lastName,
            phone:     updatedUser.phoneNumber,
            location:  updatedUser.location,
          });
          this.auth.fetchUserProfile(id).pipe(take(1)).subscribe();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.notifications.error(apiErrorSummary(err));
        },
      });
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private bindLocationSearch(): void {
    this.locationQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query) {
            this.locationSuggestions.set([]);
            return of([] as GooglePlacePrediction[]);
          }
          this.locationSearchLoading.set(true);
          return this.googlePlaces.searchPlaces(query, this.sessionToken).pipe(
            catchError(() => of([] as GooglePlacePrediction[]))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        this.locationSearchLoading.set(false);
        this.locationSuggestions.set(results);
      });
  }
}

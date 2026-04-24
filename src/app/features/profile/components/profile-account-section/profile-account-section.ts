import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { take } from 'rxjs';
import { UserProfileModel } from '../../../../core/models/profile.models';
import { UserService, UpdateUserPayload } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import { ActionButtonComponent } from "../../../../shared/ui/action-button/action-button";
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-account-section',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ActionButtonComponent,
],
  templateUrl: './profile-account-section.html',
  styleUrl: './profile-account-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAccountSection {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly profile = input.required<UserProfileModel>();
  readonly saving = signal(false);

  @Output() readonly saved = new EventEmitter<Partial<UserProfileModel>>();

  readonly form = this.fb.nonNullable.group({
    firstName:   ['', [Validators.required, Validators.maxLength(60)]],
    lastName:    ['', [Validators.required, Validators.maxLength(60)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    location:    ['', Validators.maxLength(200)],
  });

  constructor() {
    // Re-patches whenever profile signal changes (initial load + after fetchUserProfile resolves)
    effect(() => {
      const p = this.profile();
      this.form.patchValue({
        firstName:   p.firstName ?? '',
        lastName:    p.lastName  ?? '',
        phoneNumber: p.phone     ?? '',
        location:    p.location  ?? '',
      }, { emitEvent: false });
    });
  }

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
          // Re-fetch to sync BehaviorSubject — updates header name and any other consumers
          this.auth.fetchUserProfile(id).pipe(take(1)).subscribe();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.notifications.error(apiErrorSummary(err));
        },
      });
  }
}

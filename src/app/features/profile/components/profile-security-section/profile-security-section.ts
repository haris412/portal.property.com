import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { take } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';

/** Shows mat-error on confirmPassword when the parent group has a passwordMismatch error. */
class PasswordMismatchStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control?.touched && form?.form?.hasError('passwordMismatch'));
  }
}

@Component({
  selector: 'app-profile-security-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ActionButtonComponent,
  ],
  templateUrl: './profile-security-section.html',
  styleUrl: './profile-security-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSecuritySection {
  private readonly fb            = inject(FormBuilder);
  private readonly auth          = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly saving          = signal(false);
  readonly showPassword    = signal({ current: false, new: false, confirm: false });
  readonly mismatchMatcher = new PasswordMismatchStateMatcher();

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();

    this.saving.set(true);
    this.auth
      .changePassword(currentPassword, newPassword, confirmPassword)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('Password updated successfully');
          this.form.reset();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          const msg = (err as { message?: string })?.message ?? 'Could not update password. Please try again.';
          this.notifications.error(msg);
        },
      });
  }
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword     = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

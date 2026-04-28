import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, startWith } from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { PasswordResetFlowService } from '../../../../core/services/password-reset-flow.service';
import { TranslateModule } from '@ngx-translate/core';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirmPassword')?.value as string | undefined;
    if (password == null || confirm == null) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  };
}

@Component({
  selector: 'app-forgot-password-new-password',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    FormFieldErrorComponent
  ],
  templateUrl: './forgot-password-new-password.component.html',
  styleUrl: './forgot-password-new-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordNewPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly flow = inject(PasswordResetFlowService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly hidePassword = signal(true);
  readonly hideConfirm = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly formOk = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [passwordsMatchValidator()] }
  );

  readonly canSubmit = computed(() => this.formOk() && !this.loading());

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const g = this.form;
        this.formOk.set(
          g.controls.password.valid &&
            g.controls.confirmPassword.valid &&
            !g.hasError('passwordsMismatch')
        );
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const token = this.flow.resetToken();
    if (!token) {
      void this.router.navigate(['/forgot-password']);
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const { password } = this.form.getRawValue();
    this.auth
      .resetPassword(token, password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.flow.clear();
          this.auth.setRedirectMessage(
            'Your password has been reset. You can sign in with your new password.'
          );
          void this.router.navigate(['/auth']);
        },
        error: (err: unknown) => {
          this.error.set(
            (err as { message?: string }).message ??
              'Could not reset password. Please start again from the email step.'
          );
        }
      });
  }
}

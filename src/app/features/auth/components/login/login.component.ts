import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    SocialButtonComponent,
    FormFieldErrorComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  /** Pass true from admin portal — enables OTP flow via AdminAuthService */
  @Input() isAdmin = false;
  readonly showIntro = input(true);

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  /** Admin only: flips to true after credentials are verified, shows OTP field */
  readonly otpStep = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
    otp: [''], // admin only — validator added dynamically on OTP step
  });

  constructor() {}

  readonly primaryActionLabel = computed(() => {
    const t = (k: string) => this.translate.instant(k);
    if (!this.isAdmin)
      return this.loading() ? t('public.signIn.ctaLoading') : t('public.signIn.cta');
    return t('public.signIn.cta');
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth
      .login({ email: email.trim(), password })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.log(err);
          this.error.set(err?.message ?? 'Login failed. Please try again.');
          return throwError(() => err);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ user }) => {
          this.router.navigate([this.postLoginRoute(user.roles)]);
        },
      });
  }

  private postLoginRoute(roles: string[]): string {
    return roles.includes('Buyer') ? '/appointments' : '/dashboard';
  }
}

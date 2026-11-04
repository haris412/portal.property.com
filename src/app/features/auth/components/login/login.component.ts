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
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    NgxMaterialIntlTelInputComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  /** Admin portal hides forgot-password and social buttons. */
  @Input() isAdmin = false;
  readonly showIntro = input(true);

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    method: ['email' as 'email' | 'phone', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  constructor() {}

  readonly primaryActionLabel = computed(() => {
    const t = (k: string) => this.translate.instant(k);
    return this.loading() ? t('public.signIn.ctaLoading') : t('public.signIn.cta');
  });

  setIdentifierMethod(method: 'email' | 'phone'): void {
    this.form.controls.method.setValue(method);
    const email = this.form.controls.email;
    const phone = this.form.controls.phoneNumber;
    if (method === 'phone') {
      phone.setValidators([Validators.required]);
      email.clearValidators();
      email.setValue('');
    } else {
      email.setValidators([Validators.required, Validators.email]);
      phone.clearValidators();
      phone.setValue('');
    }
    email.updateValueAndValidity();
    phone.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const { method, email, phoneNumber, password } = this.form.getRawValue();
    const payload = method === 'phone'
      ? { method: 'phone' as const, phoneNumber: phoneNumber.trim(), password }
      : { method: 'email' as const, email: email.trim(), password };
    this.auth
      .login(payload)
      .pipe(
        catchError((err: { message?: string }) => {
          this.error.set(err?.message ?? 'Login failed. Please try again.');
          return throwError(() => err);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        error: () => undefined,
        next: ({ user }) => {
          this.router.navigate([this.postLoginRoute(user.roles)]);
        },
      });
  }

  private postLoginRoute(roles: string[]): string {
    return roles.includes('Buyer') ? '/appointments' : '/dashboard';
  }
}

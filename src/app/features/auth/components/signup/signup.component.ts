import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import {
  getDefaultUserTypeOptions,
  rolesToUserTypeOptions,
  type UserTypeOption
} from '../../../../core/models/auth.models';
import { AuthService, agencyNameAvailableValidator } from '../../../../core/services/auth.service';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { TranslateModule } from '@ngx-translate/core';
import { IAccountSignUp } from '../../../../core/interfaces/account.interface';

const REGISTER_ERROR_FALLBACK = 'Registration failed. Please try again.';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    SocialButtonComponent,
    FormFieldErrorComponent,
    NgxMaterialIntlTelInputComponent
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit {
  readonly showIntro = input(true);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // —— UI state ——
  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly phoneOtpStep = signal(false);
  readonly challengeToken = signal<string | null>(null);
  readonly maskedDestination = signal('');
  readonly resending = signal(false);
  readonly rolesLoading = signal(true);
  readonly showAgencyName = signal(false);
  readonly lockUserType = signal(false);

  // —— Options & data (user types from API) ——
  readonly userTypes = signal<UserTypeOption[]>(getDefaultUserTypeOptions());
  readonly form = this.buildForm();
  ngOnInit(): void {
    this.getRoles();
    if (this.auth.userData()){
      console.log(this.auth.userData());
      this.form.patchValue({
        ...this.auth.userData()
      });
      if(this.auth?.userData()?.role === 'buyer') this.lockUserType.set(true);
    };
  }  

  getRoles(){
    this.auth.getRoles().subscribe({
      next: (roles) => {
        const options =
          roles?.length > 0 ? rolesToUserTypeOptions(roles) : getDefaultUserTypeOptions();
        this.userTypes.set(options);
      },
      error: () => {
        this.userTypes.set(getDefaultUserTypeOptions());
        this.rolesLoading.set(false);
      },
      complete: () => this.rolesLoading.set(false),
    });
  }
  

  onSubmit(): void {
    if (this.phoneOtpStep()) {
      this.verifyPhone();
      return;
    }
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.successMessage.set(null);
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const payload: IAccountSignUp = {
      signupMethod: raw.signupMethod,
      password: raw.password,
      agree: raw.agree,
      role: raw.role,
      ...(raw.agencyName.trim() ? { agencyName: raw.agencyName.trim() } : {}),
      ...(raw.signupMethod === 'phone'
        ? { phoneNumber: raw.phoneNumber.trim() }
        : { email: raw.email.trim() }),
    };
    this.auth.register(payload).subscribe({
      next: (res) => {
        if (res.challengeToken) {
          this.challengeToken.set(res.challengeToken);
          this.maskedDestination.set(res.maskedDestination ?? '');
          this.form.controls.otp.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
          this.form.controls.otp.updateValueAndValidity();
          this.phoneOtpStep.set(true);
          this.loading.set(false);
          return;
        }
        this.successMessage.set(res.message ?? 'User registered successfully. Please verify your email.');
        this.form.reset();
        setTimeout(() => {
          this.auth.activeSegment.set('login');
          this.router.navigate(['/auth'], { replaceUrl: true });
        }, 2500);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set((err as { message?: string })?.message ?? REGISTER_ERROR_FALLBACK);
      },
      complete: () => this.loading.set(false)
    });
  }


  private buildForm() {
    const f = this.fb;
    const form = f.nonNullable.group({
      signupMethod: ['email' as 'email' | 'phone', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      // location: f.control<string | ICountry | null>('', [Validators.required]),
      role: ['Seller', [Validators.required]],
      agencyName: f.nonNullable.control('', { updateOn: 'blur' }),
      password: ['', [Validators.required]],
      agree: [false, [Validators.requiredTrue]],
      otp: [''],
    });

    form.controls.signupMethod.valueChanges
      .pipe(startWith(form.controls.signupMethod.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => this.applyIdentifierValidators(form, method));

    // Show/hide agency name field and toggle its validators based on user type
    form.controls.role.valueChanges
      .pipe(startWith(form.controls.role.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        const ctrl = form.controls.agencyName;
        const isAgent = type === 'Agent';
        this.showAgencyName.set(isAgent);
        if (isAgent) {
          ctrl.setValidators([Validators.required, Validators.minLength(2)]);
          ctrl.setAsyncValidators([agencyNameAvailableValidator(this.auth)]);
        } else {
          form.controls.agencyName.clearValidators();
          form.controls.agencyName.clearAsyncValidators();
          form.controls.agencyName.reset('');
        }
        form.controls.agencyName.updateValueAndValidity({ emitEvent: false });
      });
    return form;
  }

  setSignupMethod(method: 'email' | 'phone'): void {
    if (this.phoneOtpStep()) return;
    this.form.controls.signupMethod.setValue(method);
  }

  resendPhoneOtp(): void {
    const token = this.challengeToken();
    if (!token || this.resending()) return;
    this.error.set(null);
    this.resending.set(true);
    this.auth.resendPhoneOtp(token).subscribe({
      next: (result) => {
        this.resending.set(false);
        if (result.maskedDestination) this.maskedDestination.set(result.maskedDestination);
      },
      error: (err: unknown) => {
        this.resending.set(false);
        this.error.set((err as { message?: string })?.message ?? 'Could not send a new code. Please try again.');
      },
    });
  }

  private verifyPhone(): void {
    const otp = this.form.controls.otp;
    if (otp.invalid) {
      otp.markAsTouched();
      return;
    }
    const token = this.challengeToken();
    if (!token) return;
    this.error.set(null);
    this.loading.set(true);
    this.auth.verifyPhone(token, otp.value).subscribe({
      next: () => {
        this.successMessage.set('Phone number verified. You can sign in.');
        this.phoneOtpStep.set(false);
        this.challengeToken.set(null);
        this.form.controls.otp.clearValidators();
        this.form.controls.otp.updateValueAndValidity();
        this.form.reset();
        this.loading.set(false);
        setTimeout(() => {
          this.auth.activeSegment.set('login');
          this.router.navigate(['/auth'], { replaceUrl: true });
        }, 2500);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set((err as { message?: string })?.message ?? 'Invalid or expired code. Please try again.');
      },
    });
  }

  private applyIdentifierValidators(
    form: { controls: { email: AbstractControl; phoneNumber: AbstractControl } },
    method: 'email' | 'phone',
  ): void {
    const email = form.controls.email;
    const phone = form.controls.phoneNumber;
    if (method === 'phone') {
      phone.setValidators([Validators.required]);
      email.clearValidators();
      email.setValue('');
    } else {
      email.setValidators([Validators.required, Validators.email]);
      phone.clearValidators();
      phone.setValue('');
    }
    email.updateValueAndValidity({ emitEvent: false });
    phone.updateValueAndValidity({ emitEvent: false });
  }

}


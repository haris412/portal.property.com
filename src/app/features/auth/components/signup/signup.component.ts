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
  readonly rolesLoading = signal(true);
  readonly showAgencyName = signal(false);
  readonly lockUserType = signal(false);

  // —— Options & data (user types from API) ——
  readonly userTypes = signal<UserTypeOption[]>(getDefaultUserTypeOptions());
  readonly form = this.buildForm();
  ngOnInit(): void {
    this.getRoles();
    if (this.auth.userData()){
      this.form.patchValue({
        ...this.auth.userData()
      });
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
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.successMessage.set(null);
    this.loading.set(true);
    this.auth.register(this.form.getRawValue() as IAccountSignUp).subscribe({
      next: (res) => {
        this.successMessage.set(res.message ?? 'User registered successfully. Please verify your email.');
        this.form.reset();
        this.auth.activeSegment.set('login');
        setTimeout(() => this.router.navigate(['/auth'], { replaceUrl: true }), 2500);
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
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      // location: f.control<string | ICountry | null>('', [Validators.required]),
      roleName: ['Seller', [Validators.required]],
      agencyName: f.nonNullable.control('', { updateOn: 'blur' }),
      password: ['', [Validators.required]],
      agree: [false, [Validators.requiredTrue]],
    });

    // Show/hide agency name field and toggle its validators based on user type
    form.controls.roleName.valueChanges
      .pipe(startWith(form.controls.roleName.value), takeUntilDestroyed(this.destroyRef))
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

}


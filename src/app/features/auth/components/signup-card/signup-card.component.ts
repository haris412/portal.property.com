import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
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
import countryList from 'country-state-city/lib/assets/country.json';
import type { ICountry } from 'country-state-city';

import {
  filterCountriesBySearch,
  findCountryByCode,
  formatLocationCountryDisplay,
  formatPhoneCountryDisplay,
  getLocationIsoCode,
  validCountryCodeValidator,
  validLocationCountryValidator
} from '../../../../shared/utils/country-filter.util';
import {
  DEFAULT_PHONE_VALIDATION_CONFIG,
  phoneNumberValidator
} from '../../../../shared/validators/phone-number.validator';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import {
  getDefaultUserTypeOptions,
  rolesToUserTypeOptions,
  type UserTypeOption
} from '../../../../core/models/auth.models';
import { AuthService, RegisterPayload } from '../../../../core/services/auth.service';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';

const DEFAULT_PHONE_COUNTRY_CODE = 'US';
const REGISTER_ERROR_FALLBACK = 'Registration failed. Please try again.';

interface SignupFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  locationCountryCode: string | ICountry | null;
  userType: string;
  password: string;
  agree: boolean;
}

interface SignupFormControls {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  phoneCountryCode: FormControl<string>;
  phone: FormControl<string>;
  locationCountryCode: FormControl<string | ICountry | null>;
  userType: FormControl<string>;
  password: FormControl<string>;
  agree: FormControl<boolean>;
}

@Component({
  selector: 'app-signup-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    SocialButtonComponent,
    FormFieldErrorComponent
  ],
  templateUrl: './signup-card.component.html',
  styleUrl: './signup-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupCardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // —— UI state ——
  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly rolesLoading = signal(true);
  private readonly formValid = signal(false);

  // —— Options & data (user types from API) ——
  readonly userTypes = signal<UserTypeOption[]>(getDefaultUserTypeOptions());
  readonly countries: ICountry[] = countryList as ICountry[];

  ngOnInit(): void {
    this.loadUserTypeOptions();
  }

  /** Fetch roles from backend and populate user type options; fallback to defaults on error. */
  private loadUserTypeOptions(): void {
    this.auth
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roleNames) => {
          const options =
            roleNames.length > 0
              ? rolesToUserTypeOptions(roleNames)
              : getDefaultUserTypeOptions();
          this.userTypes.set(options);
        },
        error: () => {
          this.userTypes.set(getDefaultUserTypeOptions());
          this.rolesLoading.set(false);
        },
        complete: () => this.rolesLoading.set(false)
      });
  }

  // —— Search terms for dropdowns ——
  readonly phoneCountrySearchTerm = signal('');
  readonly locationCountrySearchTerm = signal('');

  // —— Filtered lists for autocomplete ——
  readonly filteredPhoneCountries = computed(() =>
    filterCountriesBySearch(this.countries, this.phoneCountrySearchTerm(), {
      includePhoneCode: true,
      codeOnly: true
    })
  );

  readonly filteredLocationCountries = computed(() =>
    filterCountriesBySearch(this.countries, this.locationCountrySearchTerm(), {
      codeOnly: false
    })
  );

  readonly form = this.buildForm();
  readonly canSubmit = computed(() => this.formValid() && !this.loading());

  // —— Autocomplete display: show in input when value is set ——
  displayPhoneCountry = (isoCode: string): string =>
    formatPhoneCountryDisplay(findCountryByCode(this.countries, isoCode));

  displayLocationCountry = (value: string | ICountry | null): string => {
    if (value != null && typeof value === 'object' && 'name' in value)
      return (value as ICountry).name ?? '';
    return formatLocationCountryDisplay(
      findCountryByCode(this.countries, typeof value === 'string' ? value : '')
    );
  };

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    const payload = this.buildRegisterPayload(this.form.getRawValue());
    this.auth.register(payload).subscribe({
      next: () =>
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' },
          replaceUrl: true
        }),
      error: (err: unknown) => {
        this.loading.set(false);
        const message =
          (err as { message?: string }).message ?? REGISTER_ERROR_FALLBACK;
        this.error.set(message);
      },
      complete: () => this.loading.set(false)
    });
  }

  // —— Keep location search term in sync with form value (for autocomplete filter) ——
  private setLocationSearchFromValue(value: string | ICountry | null): void {
    if (value == null) {
      this.locationCountrySearchTerm.set('');
      return;
    }
    const term =
      typeof value === 'object' && 'name' in value
        ? (value as ICountry).name ?? ''
        : String(value);
    this.locationCountrySearchTerm.set(term);
  }

  // —— Build form and wire validity, search terms, and phone validation ——
  private buildForm(): FormGroup<SignupFormControls> {
    const form = this.createFormGroup();
    form.controls.phone.addValidators(
      phoneNumberValidator(
        form.controls.phoneCountryCode,
        DEFAULT_PHONE_VALIDATION_CONFIG
      )
    );
    this.wireFormReactivity(form);
    return form;
  }

  private createFormGroup(): FormGroup<SignupFormControls> {
    return new FormGroup<SignupFormControls>({
      firstName: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(2)
      ]),
      lastName: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(2)
      ]),
      email: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email
      ]),
      phoneCountryCode: this.fb.nonNullable.control(DEFAULT_PHONE_COUNTRY_CODE, [
        Validators.required,
        validCountryCodeValidator(this.countries)
      ]),
      phone: this.fb.nonNullable.control('', [Validators.required]),
      locationCountryCode: this.fb.control<string | ICountry | null>('', [
        Validators.required,
        validLocationCountryValidator(this.countries)
      ]),
      userType: this.fb.nonNullable.control('Buyer', [
        Validators.required
      ]),
      password: this.fb.nonNullable.control('', [Validators.required]),
      agree: this.fb.nonNullable.control(false, [Validators.requiredTrue])
    });
  }

  private wireFormReactivity(form: FormGroup<SignupFormControls>): void {
    form.statusChanges
      .pipe(startWith(form.status), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formValid.set(form.valid));

    this.phoneCountrySearchTerm.set(
      form.controls.phoneCountryCode.value ?? ''
    );
    form.controls.phoneCountryCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string | null) =>
        this.phoneCountrySearchTerm.set((value ?? '').toString())
      );

    this.setLocationSearchFromValue(form.controls.locationCountryCode.value);
    form.controls.locationCountryCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string | ICountry | null) =>
        this.setLocationSearchFromValue(value)
      );

    form.controls.phoneCountryCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => form.controls.phone.updateValueAndValidity());
  }

  // —— Map form value to API payload (role sent as-is to backend) ——
  private buildRegisterPayload(value: SignupFormValue): RegisterPayload {
    const phoneNumber = this.formatPhoneNumber(value);
    const location = this.formatLocation(value);

    const payload: RegisterPayload = {
      email: value.email.trim(),
      password: value.password,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      roleName: value.userType?.trim() ?? '',
      phoneNumber
    };
    if (location) payload.location = location;
    return payload;
  }

  private formatPhoneNumber(value: SignupFormValue): string {
    const country = findCountryByCode(this.countries, value.phoneCountryCode);
    const codeDigits = (country?.phonecode ?? '').replace(/\D/g, '');
    const numberDigits =
      (value.phone ?? '').replace(/\D/g, '').replace(/^0+/, '') || '';
    return codeDigits ? `+${codeDigits}${numberDigits}` : numberDigits;
  }

  private formatLocation(value: SignupFormValue): string | undefined {
    const isoCode = getLocationIsoCode(value.locationCountryCode);
    const country = findCountryByCode(this.countries, isoCode);
    if (!country) return undefined;
    return JSON.stringify({
      country: country.name,
      countryCode: isoCode
    });
  }
}

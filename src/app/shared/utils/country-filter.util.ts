import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { ICountry } from 'country-state-city';

export interface FilterCountriesOptions {
  /** Include phone code in search (e.g. "92" matches Pakistan) */
  includePhoneCode?: boolean;
  /** Search only by isoCode and phone code (no country name). Use for "Code" field. */
  codeOnly?: boolean;
}

/**
 * Filters countries by search term.
 * - If codeOnly: true → matches only isoCode and (if includePhoneCode) phone code.
 * - Otherwise → matches country name (case-insensitive), isoCode, and optionally phone code.
 */
export function filterCountriesBySearch(
  countries: ICountry[],
  search: string,
  options?: FilterCountriesOptions
): ICountry[] {
  const term = (search ?? '').trim().toLowerCase();
  if (!term) return countries;

  const includePhoneCode = options?.includePhoneCode ?? false;
  const codeOnly = options?.codeOnly ?? false;

  return countries.filter((c) => {
    if (c.isoCode.toLowerCase().includes(term)) return true;
    if (includePhoneCode) {
      const phoneDigits = (c.phonecode ?? '').replace(/\D/g, '');
      const searchDigits = term.replace(/\D/g, '');
      if (searchDigits && phoneDigits.includes(searchDigits)) return true;
    }
    if (!codeOnly && c.name.toLowerCase().includes(term)) return true;
    return false;
  });
}

/** Find country by isoCode */
export function findCountryByCode(countries: ICountry[], isoCode: string): ICountry | undefined {
  return countries.find((c) => c.isoCode === isoCode);
}

/** Display for phone code field: "+92 PK" */
export function formatPhoneCountryDisplay(country: ICountry | undefined): string {
  return country ? `+${country.phonecode} ${country.isoCode}` : '';
}

/** Display for location field: country name */
export function formatLocationCountryDisplay(country: ICountry | undefined): string {
  return country?.name ?? '';
}

/** Validator: value must be a valid country isoCode from the given list */
export function validCountryCodeValidator(countries: ICountry[]): ValidatorFn {
  const isoCodes = new Set(countries.map((c) => c.isoCode));
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || v === '') return null; // use Validators.required for empty
    if (typeof v !== 'string') return { invalidCountryCode: true };
    return isoCodes.has(v) ? null : { invalidCountryCode: true };
  };
}

/** Get isoCode from control value that may be string (isoCode) or ICountry. For payload/API. */
export function getLocationIsoCode(value: string | ICountry | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'object' && 'isoCode' in value) return (value as ICountry).isoCode;
  return String(value);
}

/** Validator for location: value may be ICountry (from autocomplete) or string isoCode. */
export function validLocationCountryValidator(countries: ICountry[]): ValidatorFn {
  const isoCodes = new Set(countries.map((c) => c.isoCode));
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || v === '') return null;
    const code = getLocationIsoCode(v);
    return code && isoCodes.has(code) ? null : { invalidCountryCode: true };
  };
}

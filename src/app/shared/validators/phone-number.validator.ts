import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// —— Config ——
export interface PhoneValidationConfig {
  lengthByIso: Record<string, { min: number; max: number }>;
  defaultLength: { min: number; max: number };
}

const L = (min: number, max?: number) => ({ min, max: max ?? min });

export const DEFAULT_PHONE_VALIDATION_CONFIG: PhoneValidationConfig = {
  defaultLength: L(7, 15),
  lengthByIso: {
    US: L(10), CA: L(10), PK: L(10), IN: L(10), AU: L(9), GB: L(10, 11),
    DE: L(10, 11), FR: L(9), IT: L(9, 11), ES: L(9), NL: L(9), BE: L(9),
    AT: L(10, 13), CH: L(9), CN: L(11), JP: L(10), KR: L(9, 10), SG: L(8),
    MY: L(9, 10), AE: L(9), SA: L(9), TR: L(10), RU: L(10), BR: L(10, 11),
    MX: L(10), AR: L(10, 11), ZA: L(9), EG: L(9), NG: L(10, 11), KE: L(9)
  }
};

// —— Validator (country from control, rules from config) ——
export function phoneNumberValidator(
  countryControl: AbstractControl,
  config: PhoneValidationConfig
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    const digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    if (raw.startsWith('0')) {
      return { phoneLeadingZero: true, message: 'Enter number without leading 0 (e.g. 1234567890)' };
    }

    const isoCode = (countryControl.value ?? '').toString().trim();
    const rule = config.lengthByIso[isoCode] ?? config.defaultLength;

    if (digits.length < rule.min) return { phoneTooShort: true, message: `At least ${rule.min} digits` };
    if (digits.length > rule.max) return { phoneTooLong: true, message: `At most ${rule.max} digits` };
    return null;
  };
}

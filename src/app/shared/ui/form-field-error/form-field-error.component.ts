import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message) {
      <p class="form-error" aria-live="polite">
        {{ message }}
      </p>
    }
  `,
  styles: [
    `
      .form-error {
        margin: 0 0 0 16px;
        padding: 4px 0 0;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--font-main);
        border-left: 3px solid var(--primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldErrorComponent {
  @Input({ required: true }) control!: AbstractControl | null;
  @Input() label?: string;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const ctrl = this.control;
    if (!ctrl) return;
    ctrl.statusChanges?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    ctrl.valueChanges?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  get message(): string | null {
    const control = this.control;
    if (!control) return null;
    if (!(control.touched || control.dirty)) return null;
    if (!control.invalid) return null;

    const errors: ValidationErrors | null = control.errors;
    if (!errors) return null;

    if (errors['required']) {
      return `${this.label ?? 'This field'} is required.`;
    }

    if (errors['email']) {
      return 'Enter a valid email address.';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength']?.requiredLength;
      if (typeof requiredLength === 'number') {
        return `${this.label ?? 'This field'} must be at least ${requiredLength} characters.`;
      }
      return `${this.label ?? 'This field'} is too short.`;
    }

    if (errors['requiredTrue']) {
      return 'You must accept the terms and privacy policy.';
    }

    if (errors['invalidCountryCode']) {
      return 'Please select a valid country from the list.';
    }

    if (errors['phoneLeadingZero']) {
      return errors['message'] ?? 'Enter number without leading 0 (e.g. 312990099)';
    }
    if (errors['phoneTooShort'] || errors['phoneTooLong']) {
      return errors['message'] ?? 'Enter a valid phone number.';
    }

    return 'Please check this field.';
  }
}


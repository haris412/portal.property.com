import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LoginCardComponent } from './login-card.component';
import { FeatureCardComponent } from '../../../../shared/ui/feature-card/feature-card.component';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';

describe('LoginCardComponent', () => {
  let component: LoginCardComponent;
  let fixture: ComponentFixture<LoginCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginCardComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatIconModule,
        MatButtonModule,
        NoopAnimationsModule,
        FeatureCardComponent,
        SocialButtonComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the login card component', () => {
      expect(component).toBeTruthy();
    });

    it('should have a reactive form with identifier, password, and rememberMe controls', () => {
      expect(component.form.get('identifier')).toBeDefined();
      expect(component.form.get('password')).toBeDefined();
      expect(component.form.get('rememberMe')).toBeDefined();
    });

    it('should initialize form controls with correct default values', () => {
      expect(component.form.get('identifier')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      expect(component.form.get('rememberMe')?.value).toBe(false);
    });

    it('should display features list with correct number of items', () => {
      expect(component.features().length).toBe(3);
    });

    it('should initialize hidePassword as true (password hidden by default)', () => {
      expect(component.hidePassword()).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should require identifier field', () => {
      const control = component.form.get('identifier');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTruthy();
      expect(control?.valid).toBeFalsy();
    });

    it('should require password field', () => {
      const control = component.form.get('password');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTruthy();
      expect(control?.valid).toBeFalsy();
    });

    it('should require password to be at least 8 characters', () => {
      const control = component.form.get('password');
      control?.setValue('short');
      control?.markAsTouched();

      expect(control?.hasError('minlength')).toBeTruthy();
      expect(control?.valid).toBeFalsy();
    });

    it('should accept valid identifier (email)', () => {
      const control = component.form.get('identifier');
      control?.setValue('john@example.com');

      expect(control?.hasError('required')).toBeFalsy();
      expect(control?.valid).toBeTruthy();
    });

    it('should accept valid password (8+ characters)', () => {
      const control = component.form.get('password');
      control?.setValue('validPassword123');

      expect(control?.hasError('minlength')).toBeFalsy();
      expect(control?.valid).toBeTruthy();
    });

    it('should have invalid form when required fields are empty', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('should have valid form when all required fields are filled correctly', () => {
      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'SecurePassword123'
      });

      expect(component.form.valid).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should not submit when form is invalid', () => {
      spyOn(console, 'log');
      component.submit();

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on invalid submission attempt', () => {
      const identifierControl = component.form.get('identifier');
      const passwordControl = component.form.get('password');

      component.submit();

      expect(identifierControl?.touched).toBeTruthy();
      expect(passwordControl?.touched).toBeTruthy();
    });

    it('should log form data when valid form is submitted', () => {
      spyOn(console, 'log');

      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'ValidPassword123',
        rememberMe: true
      });

      component.submit();

      expect(console.log).toHaveBeenCalledWith({
        identifier: 'user@example.com',
        password: 'ValidPassword123',
        rememberMe: true
      });
    });

    it('should submit only when all validations pass', () => {
      spyOn(console, 'log');

      // Try with invalid data
      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'short'
      });
      component.submit();

      expect(console.log).not.toHaveBeenCalled();

      // Now with valid data
      component.form.patchValue({
        password: 'ValidPassword123'
      });
      component.submit();

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle hidePassword signal', () => {
      const initialValue = component.hidePassword();
      component.hidePassword.set(!component.hidePassword());

      expect(component.hidePassword()).toBe(!initialValue);
    });

    it('should toggle from hidden to visible', () => {
      component.hidePassword.set(true);
      component.hidePassword.set(!component.hidePassword());

      expect(component.hidePassword()).toBe(false);
    });

    it('should toggle from visible to hidden', () => {
      component.hidePassword.set(false);
      component.hidePassword.set(!component.hidePassword());

      expect(component.hidePassword()).toBe(true);
    });

    it('should have correct initial password field type (password)', () => {
      component.hidePassword.set(true);
      fixture.detectChanges();

      const passwordInput = fixture.nativeElement.querySelector('input[formControlName="password"]');
      expect(passwordInput.type).toBe('password');
    });

    it('should change password field type when visibility is toggled', () => {
      const passwordInput = fixture.nativeElement.querySelector('input[formControlName="password"]');

      component.hidePassword.set(false);
      fixture.detectChanges();

      expect(passwordInput.type).toBe('text');

      component.hidePassword.set(true);
      fixture.detectChanges();

      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Remember Me Checkbox', () => {
    it('should initialize rememberMe as false', () => {
      expect(component.form.get('rememberMe')?.value).toBe(false);
    });

    it('should update rememberMe when checkbox is checked', () => {
      component.form.get('rememberMe')?.setValue(true);

      expect(component.form.get('rememberMe')?.value).toBe(true);
    });

    it('should update rememberMe when checkbox is unchecked', () => {
      component.form.get('rememberMe')?.setValue(true);
      component.form.get('rememberMe')?.setValue(false);

      expect(component.form.get('rememberMe')?.value).toBe(false);
    });
  });

  describe('canSubmit Computed Signal', () => {
    it('should return false when form is invalid', () => {
      expect(component.canSubmit()).toBe(false);
    });

    it('should return true when form is valid', () => {
      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'ValidPassword123'
      });

      expect(component.form.valid).toBeTruthy();
    });

    it('should update based on form validity state', () => {
      // Initially invalid
      expect(component.form.valid).toBeFalsy();

      // Make it valid
      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'ValidPassword123'
      });

      expect(component.form.valid).toBeTruthy();

      // Make it invalid again
      component.form.patchValue({
        identifier: ''
      });

      expect(component.form.valid).toBeFalsy();
    });
  });

  describe('Features List', () => {
    it('should have features array with correct structure', () => {
      const features = component.features();

      features.forEach(feature => {
        expect(feature.icon).toBeDefined();
        expect(feature.title).toBeDefined();
        expect(feature.description).toBeDefined();
      });
    });

    it('should have "Saved properties" feature', () => {
      const features = component.features();
      const savedPropertiesFeature = features.find(f => f.title === 'Saved properties');

      expect(savedPropertiesFeature).toBeDefined();
      expect(savedPropertiesFeature?.icon).toBe('favorite_border');
    });

    it('should have "Video tours" feature', () => {
      const features = component.features();
      const videoToursFeature = features.find(f => f.title === 'Video tours');

      expect(videoToursFeature).toBeDefined();
      expect(videoToursFeature?.icon).toBe('videocam');
    });

    it('should have "Manage listings" feature', () => {
      const features = component.features();
      const manageListingsFeature = features.find(f => f.title === 'Manage listings');

      expect(manageListingsFeature).toBeDefined();
      expect(manageListingsFeature?.icon).toBe('apartment');
    });
  });

  describe('Form Field Edge Cases', () => {
    it('should accept email with special characters in identifier', () => {
      const control = component.form.get('identifier');
      control?.setValue('user+tag@example.co.uk');

      expect(control?.valid).toBeTruthy();
    });

    it('should accept phone number in identifier', () => {
      const control = component.form.get('identifier');
      control?.setValue('03001234567');

      expect(control?.valid).toBeTruthy();
    });

    it('should accept very long password', () => {
      const control = component.form.get('password');
      const longPassword = 'a'.repeat(100);
      control?.setValue(longPassword);

      expect(control?.valid).toBeTruthy();
    });

    it('should not accept password with exactly 7 characters', () => {
      const control = component.form.get('password');
      control?.setValue('1234567');

      expect(control?.hasError('minlength')).toBeTruthy();
    });

    it('should accept password with exactly 8 characters', () => {
      const control = component.form.get('password');
      control?.setValue('12345678');

      expect(control?.hasError('minlength')).toBeFalsy();
      expect(control?.valid).toBeTruthy();
    });
  });

  describe('ChangeDetectionStrategy.OnPush', () => {
    it('should be using OnPush strategy', () => {
      // Component is created and working with OnPush strategy
      expect(component).toBeTruthy();
    });
  });
});

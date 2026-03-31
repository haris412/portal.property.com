import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ContactInformationStepComponent } from './contact-information-step';

describe('ContactInformationStepComponent', () => {
  let component: ContactInformationStepComponent;
  let fixture: ComponentFixture<ContactInformationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactInformationStepComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactInformationStepComponent);
    component = fixture.componentInstance;
    const fb = TestBed.inject(FormBuilder);
    fixture.componentRef.setInput(
      'form',
      fb.group({
        contactName: [''],
        contactEmail: [''],
        contactPhoneNumber: [''],
        contactLocation: [''],
      })
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

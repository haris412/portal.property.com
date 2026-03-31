import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PropertyDescriptionStepComponent } from './property-description-step';

describe('PropertyDescriptionStepComponent', () => {
  let component: PropertyDescriptionStepComponent;
  let fixture: ComponentFixture<PropertyDescriptionStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyDescriptionStepComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyDescriptionStepComponent);
    component = fixture.componentInstance;
    const fb = TestBed.inject(FormBuilder);
    fixture.componentRef.setInput(
      'form',
      fb.group({ propertyDescription: [''] })
    );
    fixture.componentRef.setInput('aiDescriptionEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

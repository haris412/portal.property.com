import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactInformationStep } from './contact-information-step';

describe('ContactInformationStep', () => {
  let component: ContactInformationStep;
  let fixture: ComponentFixture<ContactInformationStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactInformationStep],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactInformationStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

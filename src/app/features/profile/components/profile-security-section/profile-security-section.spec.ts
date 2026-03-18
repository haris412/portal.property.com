import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSecuritySection } from './profile-security-section';

describe('ProfileSecuritySection', () => {
  let component: ProfileSecuritySection;
  let fixture: ComponentFixture<ProfileSecuritySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSecuritySection],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSecuritySection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

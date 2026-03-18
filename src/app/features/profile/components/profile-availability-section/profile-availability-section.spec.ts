import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileAvailabilitySection } from './profile-availability-section';

describe('ProfileAvailabilitySection', () => {
  let component: ProfileAvailabilitySection;
  let fixture: ComponentFixture<ProfileAvailabilitySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileAvailabilitySection],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileAvailabilitySection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

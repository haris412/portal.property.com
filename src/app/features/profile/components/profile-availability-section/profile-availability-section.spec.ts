import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProfileAvailabilitySection } from './profile-availability-section';
import { UserAvailabilityService } from '../../../../core/services/user-availability.service';

describe('ProfileAvailabilitySection', () => {
  let component: ProfileAvailabilitySection;
  let fixture: ComponentFixture<ProfileAvailabilitySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileAvailabilitySection],
      providers: [
        {
          provide: UserAvailabilityService,
          useValue: {
            getAvailability: () => of([]),
            updateAvailability: () => of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileAvailabilitySection);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

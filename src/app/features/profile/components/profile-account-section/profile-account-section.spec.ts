import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileAccountSection } from './profile-account-section';

describe('ProfileAccountSection', () => {
  let component: ProfileAccountSection;
  let fixture: ComponentFixture<ProfileAccountSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileAccountSection],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileAccountSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

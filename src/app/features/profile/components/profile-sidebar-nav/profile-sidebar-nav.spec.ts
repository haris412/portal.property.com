import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSidebarNav } from './profile-sidebar-nav';

describe('ProfileSidebarNav', () => {
  let component: ProfileSidebarNav;
  let fixture: ComponentFixture<ProfileSidebarNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSidebarNav],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSidebarNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

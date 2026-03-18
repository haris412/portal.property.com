import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, signal } from '@angular/core';
import {
  ProfileSectionKey,
  ProfileSidebarItem,
  UserProfileModel,
  AgentDayAvailability
} from '../../../../core/models/profile.models';
import { ProfileSidebarNav } from '../profile-sidebar-nav/profile-sidebar-nav';
import { ProfileAccountSection } from '../profile-account-section/profile-account-section';
import { ProfileSecuritySection } from '../profile-security-section/profile-security-section';
import { ProfileAvailabilitySection } from '../profile-availability-section/profile-availability-section';

@Component({
  selector: 'app-profile-shell',
  standalone: true,
  imports: [
    ProfileSidebarNav,
    ProfileAccountSection,
    ProfileSecuritySection,
    ProfileAvailabilitySection
  ],
  templateUrl: './profile-shell.html',
  styleUrl: './profile-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileShellComponent {
  readonly profile = input.required<UserProfileModel>();

  @Output() readonly accountSaved = new EventEmitter<Partial<UserProfileModel>>();
  @Output() readonly passwordChanged = new EventEmitter<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();
  @Output() readonly availabilitySaved = new EventEmitter<AgentDayAvailability[]>();

  readonly activeSection = signal<ProfileSectionKey>('account');

  readonly sidebarItems = signal<ProfileSidebarItem[]>([
    { id: 'account', label: 'Account Settings', icon: 'person' },
    { id: 'security', label: 'Password & Security', icon: 'lock' },
    { id: 'availability', label: 'Availability', icon: 'schedule' }
  ]);

  setActiveSection(section: ProfileSectionKey): void {
    this.activeSection.set(section);
  }
}
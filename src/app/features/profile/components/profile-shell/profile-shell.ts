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
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-shell',
  standalone: true,
  imports: [
    TranslateModule,
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

  /** When set, availability GET/PUT uses `/api/users/:id/availability`; otherwise `/api/users/me/availability`. */
  readonly availabilityUserId = input<string | null>(null);

  @Output() readonly accountSaved     = new EventEmitter<Partial<UserProfileModel>>();
  @Output() readonly availabilitySaved = new EventEmitter<AgentDayAvailability[]>();

  readonly activeSection = signal<ProfileSectionKey>('account');

  readonly sidebarItems = signal<ProfileSidebarItem[]>([
    { id: 'account',      label: 'profile.nav.account',      icon: 'person' },
    { id: 'security',     label: 'profile.nav.security',     icon: 'lock' },
    { id: 'availability', label: 'profile.nav.availability', icon: 'schedule' }
  ]);

  setActiveSection(section: ProfileSectionKey): void {
    this.activeSection.set(section);
  }
}
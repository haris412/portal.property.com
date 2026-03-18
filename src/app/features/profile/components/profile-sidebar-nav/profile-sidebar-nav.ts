import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  ProfileRole,
  ProfileSectionKey,
  ProfileSidebarItem
} from '../../../../core/models/profile.models';

@Component({
  selector: 'app-profile-sidebar-nav',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './profile-sidebar-nav.html',
  styleUrl: './profile-sidebar-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileSidebarNav {
  readonly items = input<ProfileSidebarItem[]>([]);
  readonly activeSection = input.required<ProfileSectionKey>();
  readonly role = input<ProfileRole>('user');

  @Output() readonly sectionChanged = new EventEmitter<ProfileSectionKey>();

  isVisible(item: ProfileSidebarItem): boolean {
    if (item.id === 'availability') {
      return this.role() === 'agent';
    }

    return true;
  }
}
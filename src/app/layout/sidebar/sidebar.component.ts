import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface SidebarNavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly collapsed = input<boolean>(false);
  readonly mobileOpen = input<boolean>(false);

  readonly collapsedChange = output<boolean>();
  readonly mobileClose = output<void>();

  readonly navItems: readonly SidebarNavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Properties', route: '/properties', icon: 'home_work' },
    { label: 'Add Listing', route: '/add-listing', icon: 'add_business' },
    { label: 'Messages', route: '/messages', icon: 'chat_bubble', badge: '4' },
    { label: 'Settings', route: '/settings', icon: 'settings' },
    { label: 'Profile', route: '/profile', icon: 'person' },
    { label: 'Inbox', route: '/inbox', icon: 'inbox' }
  ];

  onCollapseClick(): void {
    if (window.innerWidth <= 991.98) {
      this.mobileClose.emit();
      return;
    }

    this.collapsedChange.emit(!this.collapsed());
  }
}
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, SidebarNavItem } from '../../layout/sidebar/sidebar.component';
import { AdminHeaderComponent } from './admin-header.component';
import { NotificationContainerComponent } from '../../shared/ui/notification-container/notification-container.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    AdminHeaderComponent,
    NotificationContainerComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: '../../layout/layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly sidebarCollapsed  = signal(false);
  readonly mobileSidebarOpen = signal(false);

  readonly navItems: readonly SidebarNavItem[] = [
    { label: 'adminSidebar.nav.dashboard', route: '/admin/dashboard', icon: 'dashboard', exact: true },
    { label: 'adminSidebar.nav.agencies',  route: '/admin/agencies',  icon: 'apartment', exact: true },
    { label: 'adminSidebar.nav.users',     route: '/admin/users',     icon: 'people',    exact: true },
  ];

  toggleSidebar(): void {
    if (window.innerWidth <= 991.98) {
      this.mobileSidebarOpen.update((v) => !v);
      return;
    }
    this.sidebarCollapsed.update((v) => !v);
  }

  setSidebarCollapsed(value: boolean): void {
    this.sidebarCollapsed.set(value);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}

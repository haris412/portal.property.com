import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, SidebarNavItem } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { NotificationContainerComponent } from '../shared/ui/notification-container/notification-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, NotificationContainerComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  readonly sidebarCollapsed  = signal(false);
  readonly mobileSidebarOpen = signal(false);

  readonly navItems: readonly SidebarNavItem[] = [
    { label: 'sidebar.nav.dashboard',    route: '/dashboard',    icon: 'dashboard',    exact: true  },
    { label: 'sidebar.nav.properties',   route: '/properties',   icon: 'home_work',    exact: true  },
    { label: 'sidebar.nav.addListing',   route: '/add-listing',  icon: 'add_business'               },
    { label: 'sidebar.nav.inbox',        route: '/inbox',        icon: 'inbox'                      },
    { label: 'sidebar.nav.appointments', route: '/appointments', icon: 'event'                      },
    { label: 'My Alerts',                  route: '/alerts',       icon: 'notifications'              },
    { label: 'sidebar.nav.settings',     route: '/settings',     icon: 'settings'                   },
    { label: 'sidebar.nav.profile',      route: '/profile',      icon: 'person'                     },
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

import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, SidebarNavItem } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';
import { NotificationContainerComponent } from '../shared/ui/notification-container/notification-container.component';
import { AuthService } from '../core/services/auth.service';
import { SubscriptionPlansGateService } from '../core/services/subscription-plans-gate.service';

const ALL_NAV_ITEMS: readonly SidebarNavItem[] = [
  { label: 'sidebar.nav.dashboard',    route: '/dashboard',    icon: 'dashboard',    exact: true  },
  { label: 'sidebar.nav.properties',   route: '/properties',   icon: 'home_work',    exact: true  },
  { label: 'sidebar.nav.addListing',   route: '/add-listing',  icon: 'add_business'               },
  { label: 'sidebar.nav.inbox',        route: '/inbox',        icon: 'inbox'                      },
  { label: 'sidebar.nav.appointments', route: '/appointments', icon: 'event'                      },
  { label: 'sidebar.nav.settings',     route: '/settings',     icon: 'settings'                   },
  { label: 'sidebar.nav.profile',      route: '/profile',      icon: 'person'                     },
];

const BUYER_HIDDEN_ROUTES = new Set(['/dashboard', '/properties', '/add-listing']);

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, NotificationContainerComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly currentUser = toSignal(this.auth.currentUser$);

  readonly sidebarCollapsed  = signal(false);
  readonly mobileSidebarOpen = signal(false);

  readonly navItems = computed(() => {
    const isBuyer = this.currentUser()?.roles?.includes('Buyer') ?? false;
    return isBuyer
      ? ALL_NAV_ITEMS.filter((item) => !BUYER_HIDDEN_ROUTES.has(item.route))
      : ALL_NAV_ITEMS;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const user = this.auth.getCurrentUser();
    if (!user?._id) {
      return;
    }
    this.auth.fetchUserProfile(user._id).subscribe(() => {
      this.subscriptionPlansGate.tryOpenSubscriptionPlansIfNeeded();
    });
  }

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

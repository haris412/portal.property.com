import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface AdminSidebarNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: '../../layout/sidebar/sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent {
  readonly collapsed = input<boolean>(false);
  readonly mobileOpen = input<boolean>(false);

  readonly collapsedChange = output<boolean>();
  readonly mobileClose = output<void>();

  readonly navItems: readonly AdminSidebarNavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Agencies', route: '/admin/agencies', icon: 'apartment' },
    /** Primary action: keep icon as generic `add` for broad Material font coverage */
    { label: 'Add Agency', route: '/admin/add-agency', icon: 'add' },
    { label: 'Agency Users', route: '/admin/users', icon: 'people' },
  ];

  onCollapseClick(): void {
    if (window.innerWidth <= 991.98) {
      this.mobileClose.emit();
      return;
    }

    this.collapsedChange.emit(!this.collapsed());
  }
}

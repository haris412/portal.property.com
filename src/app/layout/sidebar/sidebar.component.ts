import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface SidebarNavItem {
  /** ngx-translate key, e.g. 'sidebar.nav.dashboard' */
  label: string;
  route: string;
  icon: string;
  badge?: string;
  /** Whether routerLinkActive uses exact matching for this item. Default: false */
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  // ── Layout state ────────────────────────────────────────────────────────────
  readonly collapsed   = input<boolean>(false);
  readonly mobileOpen  = input<boolean>(false);

  // ── Brand ───────────────────────────────────────────────────────────────────
  readonly brandLink      = input<string>('/');
  readonly brandLabel     = input<string>('EstatePortal');
  readonly brandAriaLabel = input<string>('Portal home');

  // ── Nav ─────────────────────────────────────────────────────────────────────
  readonly navItems    = input<readonly SidebarNavItem[]>([]);
  readonly navAriaLabel = input<string>('Primary navigation');

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly collapsedChange = output<boolean>();
  readonly mobileClose     = output<void>();

  onCollapseClick(): void {
    if (window.innerWidth <= 991.98) {
      this.mobileClose.emit();
      return;
    }
    this.collapsedChange.emit(!this.collapsed());
  }
}

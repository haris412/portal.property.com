import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher/language-switcher.component';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './admin-header.component.html',
  styleUrl: '../../layout/header/header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeaderComponent {
  readonly menuToggle = output<void>();

  private readonly router = inject(Router);
  private readonly adminAuth = inject(AdminAuthService);

  private readonly currentAdminUser = toSignal(this.adminAuth.currentAdminUser$, {
    initialValue: null,
  });

  readonly userMenuOpen = signal(false);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.resolveTitle()),
      startWith(this.resolveTitle())
    ),
    { initialValue: this.resolveTitle() }
  );

  readonly userName = computed(
    () => this.currentAdminUser()?.name || this.currentAdminUser()?.email || 'Admin'
  );

  readonly userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(/[\s@]+/)
      .map((part: string) => part[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  private resolveTitle(): string {
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const t = r.title;
    if (typeof t === 'string' && t.length > 0) return t;
    if (t != null) return String(t);
    return 'Admin';
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  logout(): void {
    this.closeUserMenu();
    this.adminAuth.logout();
  }
}

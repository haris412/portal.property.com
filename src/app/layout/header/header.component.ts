import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionPlansGateService } from '../../core/services/subscription-plans-gate.service';
import { isAdminRole, isBuyerRole, isSubscriptionPlansGateExcluded } from '../../core/models/role.models';
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatIconModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  readonly pageTitle = input<string>('Dashboard');
  readonly menuToggle = output<void>();

  readonly authService = inject(AuthService);
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);
  private readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  readonly userMenuOpen = signal(false);

  readonly userName = computed(() => this.currentUser()?.name || 'Admin');
  readonly canOpenSubscriptionPlans = computed(() => {
    const user = this.currentUser();
    const roles = user?.roles ?? [];
    const hasSubscriptionRole = roles.some((role) => !isAdminRole(role) && !isBuyerRole(role));
    return user?._id != null && hasSubscriptionRole && !isSubscriptionPlansGateExcluded(roles);
  });

  readonly userInitials = computed(() => {
    const name = this.userName();

    return name
      .split(' ')
      .map((part: string) => part[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleUserMenu(): void {
    this.userMenuOpen.update((value) => !value);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  openSubscriptionPlans(): void {
    this.closeUserMenu();
    this.subscriptionPlansGate.openPlansDialogForCurrentUser().subscribe();
  }
}

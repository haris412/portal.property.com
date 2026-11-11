import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AppNotificationsService } from '../../core/services/app-notifications.service';
import { SubscriptionPlansGateService } from '../../core/services/subscription-plans-gate.service';
import { isAdminRole, isBuyerRole, isSubscriptionPlansGateExcluded } from '../../core/models/role.models';
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher/language-switcher.component';
import { AccountStatusCardComponent } from '../../features/dashboard/components/account-status-card/account-status-card';
import { isIdentityVerificationRole } from '../../core/models/role.models';
import { AgentVerificationService, IdentityStatus } from '../../core/services/agent-verification.service';
import { catchError, filter, of, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatIconModule, TranslateModule, LanguageSwitcherComponent, AccountStatusCardComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  readonly pageTitle = input<string>('Dashboard');
  readonly menuToggle = output<void>();

  readonly authService = inject(AuthService);
  private readonly notifications = inject(AppNotificationsService);
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);
  private readonly verification = inject(AgentVerificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  readonly userMenuOpen = signal(false);
  readonly unreadNotificationCount = this.notifications.unreadCount;
  readonly showVerificationStatus = computed(() =>
    isIdentityVerificationRole(this.currentUser()?.roles)
  );
  readonly identityStatus = signal<IdentityStatus>('not_submitted');
  readonly identityReason = signal<string | null>(null);

  constructor() {
    this.notifications.refreshUnreadCount().subscribe({ error: () => {} });
    this.authService.currentUser$
      .pipe(
        filter((user) => isIdentityVerificationRole(user?.roles)),
        take(1),
        switchMap(() => this.verification.getMine().pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((record) => {
        if (!record) return;
        this.identityStatus.set(record.status);
        this.identityReason.set(record.rejectionReason);
      });
  }

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

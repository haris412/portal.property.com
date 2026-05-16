import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';
import { SignupCardComponent } from '../../components/signup-card/signup-card.component';
import { LoginCardComponent } from '../../components/login-card/login-card.component';
import { SegmentedTabsComponent, SegmentedTabItem } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-portal-page',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    AuthHeroPanelComponent,
    SignupCardComponent,
    LoginCardComponent,
    SegmentedTabsComponent,
  ],
  templateUrl: './auth-portal-page.component.html',
  styleUrl: './auth-portal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPortalPageComponent {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly auth   = inject(AuthService);

  /** True when route data carries { mode: 'admin' } — drives the admin layout branch. */
  readonly isAdminMode = this.route.snapshot.data['mode'] === 'admin';

  readonly authTabs: SegmentedTabItem[] = [
    { key: 'login',  label: 'Sign In' },
    { key: 'signup', label: 'Create Account' },
  ];

  readonly activeSegment  = signal<'signup' | 'login'>('login');
  readonly successMessage = signal<string | null>(null);

  constructor() {
    if (!this.isAdminMode) {
      const msg = this.auth.getAndClearRedirectMessage();
      if (msg) this.successMessage.set(msg);
      if (this.route.snapshot.queryParamMap.keys.length > 0) {
        void this.router.navigate(['/auth'], { replaceUrl: true });
      }
    }
  }

  onTabChanged(tab: string): void {
    this.activeSegment.set(tab as 'login' | 'signup');
  }
}

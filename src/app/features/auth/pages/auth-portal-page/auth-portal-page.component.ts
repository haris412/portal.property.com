import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';
import { SignupCardComponent } from '../../components/signup-card/signup-card.component';
import { LoginCardComponent } from '../../components/login-card/login-card.component';
import { SegmentedTabsComponent, SegmentedTabItem } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { SignupPrefill } from '../../components/signup-card/signup-card.component';

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
  private readonly location = inject(Location);
  private readonly route    = inject(ActivatedRoute);
  private readonly auth     = inject(AuthService);

  readonly isAdminMode = this.route.snapshot.data['mode'] === 'admin';

  readonly authTabs: SegmentedTabItem[] = [
    { key: 'login',  label: 'Sign In' },
    { key: 'signup', label: 'Create Account' },
  ];

  readonly activeSegment  = signal<'signup' | 'login'>('login');
  readonly successMessage = signal<string | null>(null);
  readonly prefill        = signal<SignupPrefill | null>(null);

  constructor() {
    if (this.isAdminMode) return;

    const msg = this.auth.getAndClearRedirectMessage();
    if (msg) this.successMessage.set(msg);

    const queryParams = this.route.snapshot.queryParamMap;
    if (queryParams.keys.length === 0) return;

    if (queryParams.get('ref') === 'inquiry' || queryParams.has('roleName')) {
      this.prefill.set({
        email:     queryParams.get('email')     ?? undefined,
        firstName: queryParams.get('firstName') ?? undefined,
        rawPhone:  queryParams.get('phone')     ?? undefined,
        roleName:  queryParams.get('roleName')  ?? undefined,
      });
      this.activeSegment.set('signup');
    }

    this.location.replaceState('/auth');
  }

  onTabChanged(tab: string): void {
    this.activeSegment.set(tab as 'login' | 'signup');
  }
}

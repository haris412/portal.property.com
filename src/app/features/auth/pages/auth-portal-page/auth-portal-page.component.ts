import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';
import { SignupCardComponent } from '../../components/signup-card/signup-card.component';
import { LoginCardComponent } from '../../components/login-card/login-card.component';
import { SegmentedTabsComponent, SegmentedTabItem } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';

@Component({
  selector: 'app-auth-portal-page',
  standalone: true,
  imports: [
    AuthHeroPanelComponent,
    SignupCardComponent,
    LoginCardComponent,
    SegmentedTabsComponent
  ],
  templateUrl: './auth-portal-page.component.html',
  styleUrl: './auth-portal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthPortalPageComponent implements OnInit {
  readonly authTabs: SegmentedTabItem[] = [
    { key: 'login', label: 'Login' },
    { key: 'signup', label: 'Sign Up' },
  ];
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly activeSegment = signal<'signup' | 'login'>('login');
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const msg = this.auth.getAndClearRedirectMessage();
    if (msg) this.successMessage.set(msg);
    if (this.route.snapshot.queryParamMap.keys.length > 0) {
      this.router.navigate(['/auth'], { replaceUrl: true });
    }
  }
  onTabChanged(tab: string): void {
    this.activeSegment.set(tab as 'login' | 'signup');
  }
}
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';
import { SignupCardComponent } from '../../components/signup-card/signup-card.component';
import { LoginCardComponent } from '../../components/login-card/login-card.component';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';

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
  private readonly route = inject(ActivatedRoute);

  readonly activeSegment = signal<'signup' | 'login'>('login');
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'true') {
        this.successMessage.set('User registered successfully. Please verify your email.');
        return;
      }
      if (params['verified'] === 'true') {
        this.successMessage.set('Email verified. You can sign in now.');
        return;
      }
      this.successMessage.set(null);
    });
  }
}
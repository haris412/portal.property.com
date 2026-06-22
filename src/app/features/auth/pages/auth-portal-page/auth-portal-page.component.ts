import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';
import { SignupComponent } from '../../components/signup/signup.component';
import { LoginComponent } from '../../components/login/login.component';
import { SegmentedTabsComponent, SegmentedTabItem } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserRole } from '../../../../core/interfaces/user.interface';

@Component({
  selector: 'app-auth-portal-page',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    AuthHeroPanelComponent,
    SignupComponent,
    LoginComponent,
    SegmentedTabsComponent,
  ],
  templateUrl: './auth-portal-page.component.html',
  styleUrl: './auth-portal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPortalPageComponent {
  private readonly location = inject(Location);
  private readonly route    = inject(ActivatedRoute);
  public  readonly auth     = inject(AuthService);

  readonly isAdminMode = this.route.snapshot.data['mode'] === 'admin';

  readonly authTabs: SegmentedTabItem[] = [
    { key: 'login',  label: 'Sign In' },
    { key: 'signup', label: 'Create Account' },
  ];

  
  readonly message = signal<EInvitationState>(EInvitationState.Processing);

  constructor() {
    if (this.isAdminMode) return;

    // const msg = this.auth.getAndClearRedirectMessage();
    // if (msg) this.message.set(msg);

    const queryParams = this.route.snapshot.queryParamMap;
    if (queryParams.keys.length === 0) return;
    const token = queryParams.get('token');
    this.checkTokenExpiry(token);
    if (queryParams.get('ref') === 'inquiry' || queryParams.has('roleName')) {
      this.auth.userData.set({
        email:     queryParams.get('email')     ?? '',
        name: queryParams.get('firstName') ?? '',
        phoneNumber:  queryParams.get('phone')     ?? '',
        role:  (queryParams.get('roleName')  ?? 'buyer') as UserRole,
      });
      this.auth.activeSegment.set('signup');
    }

    //this.location.replaceState('/auth');
  }

  onTabChanged(tab: string): void {
    this.auth.activeSegment.set(tab as 'login' | 'signup');
  }

  checkTokenExpiry(token: string | null): void {
    if (!token) return;
    let verificationPayload:any = { 
      email: this.route.snapshot.queryParamMap.get('email') ?? undefined,
      token };

    this.auth.checkTokenValidityAndExpiry(verificationPayload).subscribe({
      next: (result) => {
        // if (!result.success) {
        //   this.message.set('Your session has expired. Please log in again to continue.');
        // }
      },
      error: (err: unknown) => {
        // const msg = (err as { error: { message?: string } })?.error?.message;
        this.message.set(EInvitationState.Invalid);
      }
    });
  } 
}

export enum EInvitationState {
  Processing,
  SignupSuccess,
  Valid,
  Invalid,
}
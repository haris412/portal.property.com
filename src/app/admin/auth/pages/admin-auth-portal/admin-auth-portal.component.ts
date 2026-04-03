import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminAuthHeroPanelComponent } from '../../components/admin-auth-hero-panel/admin-auth-hero-panel.component';
import { AdminLoginCardComponent } from '../../components/admin-login-card/admin-login-card.component';

@Component({
  selector: 'app-admin-auth-portal',
  standalone: true,
  imports: [RouterLink, AdminAuthHeroPanelComponent, AdminLoginCardComponent],
  templateUrl: './admin-auth-portal.component.html',
  styleUrl: './admin-auth-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuthPortalComponent {}

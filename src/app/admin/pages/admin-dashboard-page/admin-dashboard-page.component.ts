import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPageComponent {
  private readonly adminAuth = inject(AdminAuthService);

  readonly user$ = this.adminAuth.currentAdminUser$;

  logout(): void {
    this.adminAuth.logout();
  }
}

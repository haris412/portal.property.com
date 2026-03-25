import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';

@Component({
  selector: 'app-dashboard-topbar',
  standalone: true,
  imports: [FormsModule, MatIconModule, ActionButtonComponent],
  templateUrl: './dashboard-topbar.html',
  styleUrl: './dashboard-topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardTopbarComponent {
  private readonly router = inject(Router);

  searchTerm = '';

  goToAddListing(): void {
    this.router.navigate(['/add-listing']);
  }
}
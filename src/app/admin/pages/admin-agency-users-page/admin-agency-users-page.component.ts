import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-admin-agency-users-page',
  standalone: true,
  imports: [MatIconModule, PageHeaderComponent],
  templateUrl: './admin-agency-users-page.component.html',
  styleUrl: './admin-agency-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAgencyUsersPageComponent {}

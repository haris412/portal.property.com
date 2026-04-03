import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-access-denied-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './admin-access-denied-page.component.html',
  styleUrl: './admin-access-denied-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessDeniedPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly message = this.resolveMessage();

  private resolveMessage(): string {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code === 'not_admin') {
      return 'This account does not have administrator privileges. You can continue in the user portal instead.';
    }
    return 'You do not have permission to use the admin console.';
  }
}

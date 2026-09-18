import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';
import { SubscriptionPlansGateService } from '../../../../core/services/subscription-plans-gate.service';

@Component({
  selector: 'app-payment-cancel-page',
  standalone: true,
  imports: [PageShellComponent, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './payment-cancel-page.html',
  styleUrl: './payment-cancel-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCancelPageComponent {
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);

  openPlans(): void {
    this.subscriptionPlansGate.openPlansDialogForCurrentUser().subscribe();
  }
}

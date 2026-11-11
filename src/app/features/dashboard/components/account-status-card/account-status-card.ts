import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import type { IdentityStatus } from '../../../../core/services/agent-verification.service';

@Component({
  selector: 'app-account-status-card',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule],
  templateUrl: './account-status-card.html',
  styleUrl: './account-status-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusCardComponent {
  readonly compact = input(false);
  readonly status = input<IdentityStatus>('not_submitted');
  readonly rejectionReason = input<string | null>(null);

  readonly tone = computed(() => {
    const status = this.status();
    if (status === 'verified') return 'success';
    if (status === 'pending') return 'info';
    if (status === 'rejected') return 'error';
    return 'warning';
  });

  readonly titleKey = computed(() => `verification.status.${this.status()}`);

  readonly hintKey = computed(() => {
    const status = this.status();
    if (status === 'verified') return 'verification.card.verifiedHint';
    if (status === 'pending') return 'verification.card.pendingHint';
    if (status === 'rejected') return 'verification.card.rejectedHint';
    return 'verification.card.requiredHint';
  });

  readonly actionKey = computed(() => {
    const status = this.status();
    if (status === 'verified') return 'verification.card.verifiedAction';
    if (status === 'pending') return 'verification.card.pendingAction';
    if (status === 'rejected') return 'verification.card.rejectedAction';
    return 'verification.card.requiredAction';
  });
}

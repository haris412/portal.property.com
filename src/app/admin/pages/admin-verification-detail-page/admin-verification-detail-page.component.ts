import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

import { InfoBannerComponent } from '../../../shared/ui/info-banner/info-banner';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { ConfirmationDialogService } from '../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { RejectVerificationDialogComponent } from '../../dialogs/reject-verification-dialog/reject-verification-dialog.component';
import {
  AgentVerificationService,
  VerificationDetail,
} from '../../../core/services/agent-verification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';

@Component({
  selector: 'app-admin-verification-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    InfoBannerComponent,
  ],
  templateUrl: './admin-verification-detail-page.component.html',
  styleUrl: './admin-verification-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminVerificationDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AgentVerificationService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly detail = signal<VerificationDetail | null>(null);

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId') ?? '';
    this.load(userId);
  }

  verify(): void {
    const detail = this.detail();
    if (!detail || detail.status !== 'pending' || this.saving()) return;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('verification.admin.verifyTitle'),
        message: this.translate.instant('verification.admin.verifyMessage', { name: detail.displayName }),
        confirmLabel: this.translate.instant('verification.admin.verify'),
        icon: 'verified',
      })
      .pipe(take(1))
      .subscribe((ok) => {
        if (!ok) return;
        this.saveReview(detail.userId, 'verified');
      });
  }

  reject(): void {
    const detail = this.detail();
    if (!detail || detail.status !== 'pending' || this.saving()) return;
    this.dialog
      .open<RejectVerificationDialogComponent, void, string | undefined>(RejectVerificationDialogComponent, {
        width: '460px',
        maxWidth: '92vw',
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((reason) => {
        const trimmed = reason?.trim();
        if (!trimmed) return;
        this.saveReview(detail.userId, 'rejected', trimmed);
      });
  }

  private load(userId: string): void {
    if (!userId) {
      this.loading.set(false);
      this.loadError.set(this.translate.instant('verification.admin.notFound'));
      return;
    }
    this.api.getByUserId(userId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(apiErrorSummary(error) || this.translate.instant('verification.admin.notFound'));
        this.loading.set(false);
      },
    });
  }

  private saveReview(userId: string, decision: 'verified' | 'rejected', rejectionReason?: string): void {
    this.saving.set(true);
    this.api.review(userId, decision, rejectionReason).subscribe({
      next: () => {
        const key = decision === 'verified'
          ? 'verification.admin.verifiedToast'
          : 'verification.admin.rejectedToast';
        this.notifications.success(this.translate.instant(key));
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (error) => {
        this.saving.set(false);
        this.notifications.error(apiErrorSummary(error));
      },
    });
  }
}

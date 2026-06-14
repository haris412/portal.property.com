import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import type { ColDef, GridApi } from 'ag-grid-community';
import { filter, finalize, switchMap, take } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { AgentsService } from '../../../../core/services/agents.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import type { AgentListItem } from '../../../../core/models/agent.models';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { DataGridComponent } from '../../../../shared/ui/data-grid/data-grid.component';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import {
  gridActionsColumnDef,
  type GridRowMenuItem,
} from '../../../../shared/ui/grid-row-menu-cell/grid-row-menu-cell.component';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-agents-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SectionCardComponent,
    DataGridComponent,
    InfoBannerComponent,
    TranslateModule,
  ],
  templateUrl: './agents-page.html',
  styleUrl: './agents-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly agentsApi = inject(AgentsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly agentRows = signal<AgentListItem[]>([]);

  headerActions: PageHeaderAction[] = [];
  agentColumnDefs: ColDef<AgentListItem>[] = [];
  gridOptions: { context: { menuItems: GridRowMenuItem[] } } = { context: { menuItems: [] } };

  private gridApi: GridApi | null = null;

  onGridReady(api: GridApi): void {
    this.gridApi = api;
  }

  ngOnInit(): void {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.gridApi?.refreshHeader());

    this.buildGridConfig();
    this.loadAgents();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        filter((e) => {
          const url = e.urlAfterRedirects;
          return url === '/agents' || url.startsWith('/agents?');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadAgents());
  }

  onHeaderAction(actionId: string): void {
    if (actionId === 'add-agent') {
      void this.router.navigate(['/agents/add']);
    }
  }

  private buildGridConfig(): void {
    const t = (key: string) => this.translate.instant(key) as string;

    this.headerActions = [
      { id: 'add-agent', label: t('agents.create'), variant: 'flat', icon: 'person_add' },
    ];

    this.agentColumnDefs = [
      {
        headerValueGetter: () => t('agents.tc.name'),
        valueGetter: (p) => this.formatName(p.data),
        flex: 2,
        minWidth: 160,
      },
      { field: 'email', headerValueGetter: () => t('agents.tc.email'), flex: 2, minWidth: 180 },
      { field: 'phoneNumber', headerValueGetter: () => t('agents.tc.phone'), width: 150 },
      {
        headerValueGetter: () => t('agents.tc.status'),
        valueGetter: (p) => this.formatStatus(p.data?.isActive),
        width: 120,
      },
      { field: 'createdAt', headerValueGetter: () => t('agents.tc.createdAt'), width: 140 },
      gridActionsColumnDef<AgentListItem>({ width: 64, maxWidth: 72 }),
    ];

    this.gridOptions = {
      context: {
        menuItems: this.buildMenuItems(),
      },
    };
  }

  private buildMenuItems(): GridRowMenuItem[] {
    const t = (key: string) => this.translate.instant(key) as string;
    return [
      {
        label: t('agents.actions.edit'),
        icon: 'edit',
        action: (id: string) => {
          void this.router.navigate(['/agents/edit', id]);
        },
      },
      {
        label: t('agents.actions.deactivate'),
        icon: 'person_off',
        hidden: (rowData: unknown) => (rowData as AgentListItem | undefined)?.isActive === false,
        action: (id: string, rowData?: unknown) => this.deactivateAgent(id, rowData as AgentListItem),
      },
    ];
  }

  private deactivateAgent(agentId: string, agent: AgentListItem): void {
    const t = (key: string) => this.translate.instant(key) as string;
    const agencyId = this.auth.getCurrentUser()?.agencyId?.trim();
    if (!agencyId) {
      this.notifications.error(t('agents.errors.noAgency'));
      return;
    }

    const name = this.formatName(agent);

    this.confirmDialog
      .confirm({
        title: t('agents.confirm.deactivateTitle'),
        message: t('agents.confirm.deactivateMessage').replace('{{name}}', name),
        confirmLabel: t('agents.confirm.deactivateConfirm'),
        cancelLabel: t('agents.confirm.cancel'),
        tone: 'warn',
        icon: 'person_off',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.agentsApi.deactivateAgent({ _id: agentId, agencyId })),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notifications.success(t('agents.messages.deactivated'));
          this.loadAgents();
        },
        error: (err: unknown) => this.notifications.error(apiErrorSummary(err)),
      });
  }

  private loadAgents(): void {
    const agencyId = this.auth.getCurrentUser()?.agencyId?.trim();
    if (!agencyId) {
      this.loadError.set(this.translate.instant('agents.errors.noAgency') as string);
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.agentsApi
      .getAgentsByAgency(agencyId)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.agentRows.set(result.agents);
        },
        error: (err: unknown) => {
          this.loadError.set(apiErrorSummary(err) || (this.translate.instant('agents.loadingError') as string));
        },
      });
  }

  private formatName(row?: AgentListItem | null): string {
    if (!row) {
      return '—';
    }
    const name = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
    return name || row.email || '—';
  }

  private formatStatus(isActive?: boolean): string {
    const key = isActive === false ? 'agents.statuses.inactive' : 'agents.statuses.active';
    return this.translate.instant(key) as string;
  }
}

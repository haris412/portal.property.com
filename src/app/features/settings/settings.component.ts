import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatIconModule, BreadcrumbComponent],
  template: `
  <div class="page-container">
    <app-breadcrumb [items]="breadcrumbs" />
    <div class="page-header">
      <h2 class="page-title">{{ 'settings.title' | translate }}</h2>
    </div>

    <div class="settings-links">
      <a routerLink="/subscription-usage" class="settings-links__card">
        <mat-icon fontSet="material-symbols-outlined" inline aria-hidden="true">workspace_premium</mat-icon>
        <div>
          <strong>{{ 'subscriptionUsage.title' | translate }}</strong>
          <p>{{ 'subscriptionUsage.settingsCard' | translate }}</p>
        </div>
      </a>
    </div>
  </div>
`,
  styles: [`
  .page-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--font-main);
    margin: 0;
  }

  .settings-links {
    display: grid;
    gap: 1rem;
  }

  .settings-links__card {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: inherit;
    text-decoration: none;
    transition: border-color 160ms ease, box-shadow 160ms ease;

    strong {
      display: block;
      margin-bottom: 0.25rem;
      color: var(--font-main);
    }

    p {
      margin: 0;
      color: var(--font-secondary);
      font-size: var(--font-size-body-sm);
    }

    mat-icon {
      color: var(--primary);
    }

    &:hover {
      border-color: var(--border-soft-strong);
      box-shadow: var(--shadow-soft);
    }
  }
`],
})
export class SettingsComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Settings' },
  ];
}

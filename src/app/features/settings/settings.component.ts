import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  template: `
  <div class="page-container">
    <app-breadcrumb [items]="breadcrumbs" />
    <div class="page-header">
      <h2 class="page-title">Settings</h2>
    </div>
    <div class="placeholder-card">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="var(--border-soft)" stroke-width="2"/>
        <circle cx="24" cy="24" r="6" stroke="var(--font-secondary)" stroke-width="2"/>
        <path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke="var(--font-secondary)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>Settings panel coming soon</p>
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

  .placeholder-card {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-xl);
    padding: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--font-secondary);
    font-size: 0.9rem;
  }
`],
})
export class SettingsComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Settings' },
  ];
}

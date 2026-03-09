import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li
          class="breadcrumb-item"
          *ngFor="let item of items; let last = last"
          [class.active]="last"
        >
          <a *ngIf="item.route && !last" [routerLink]="item.route" class="breadcrumb-link">
            {{ item.label }}
          </a>
          <span *ngIf="!item.route || last" class="breadcrumb-current">{{ item.label }}</span>
          <span class="breadcrumb-separator" *ngIf="!last" aria-hidden="true">/</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb { padding: 0.5rem 0; }
    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }
    .breadcrumb-link {
      color: #6366f1;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .breadcrumb-current { color: #64748b; }
    .breadcrumb-separator { color: #94a3b8; }
  `],
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}

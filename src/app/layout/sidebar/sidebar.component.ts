import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1"/>
            <path d="M8 14l6-6 6 6M8 20l6-6 6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="brand-name" *ngIf="!collapsed">Portal</span>
      </div>

      <!-- Nav Items -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of navItems" class="nav-item">
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="nav-link"
              [title]="collapsed ? item.label : ''"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge && !collapsed">{{ item.badge }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button class="collapse-btn" (click)="toggleCollapse()" [title]="collapsed ? 'Expand' : 'Collapse'">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              [attr.d]="collapsed ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
          <span *ngIf="!collapsed">Collapse</span>
        </button>
      </div>
    </aside>
  `,
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/><rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/><rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor"/></svg>`,
      route: '/dashboard',
    },
    {
      label: 'Users',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 16a4 4 0 018 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
      route: '/users',
      badge: 12,
    },
    {
      label: 'Analytics',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l4-4 3 3 4-5 3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      route: '/analytics',
    },
    {
      label: 'Settings',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
      route: '/settings',
    },
  ];

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}

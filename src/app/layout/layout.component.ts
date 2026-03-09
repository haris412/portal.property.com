import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        (collapsedChange)="sidebarCollapsed.set($event)"
      />
      <div class="main-wrapper">
        <app-header (menuToggle)="sidebarCollapsed.set(!sidebarCollapsed())" />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    .main-wrapper {
      flex: 1;
      margin-left: 240px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .app-layout.sidebar-collapsed .main-wrapper {
      margin-left: 64px;
    }
    .main-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
    @media (max-width: 768px) {
      .main-wrapper { margin-left: 0; }
      .app-layout.sidebar-collapsed .main-wrapper { margin-left: 0; }
    }
  `],
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
}

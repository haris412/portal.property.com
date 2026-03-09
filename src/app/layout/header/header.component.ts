import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <!-- Left: Menu toggle + Page title -->
      <div class="header-left">
        <button class="menu-toggle" (click)="menuToggle.emit()" aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>

      <!-- Right: Search + Notifications + User -->
      <div class="header-right">
        <!-- Search -->
        <div class="search-bar">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/>
            <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input type="text" placeholder="Search..." class="search-input" />
        </div>

        <!-- Notifications -->
        <button class="icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3l-1.5 2H17.5L16 11V8a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M8.5 17a1.5 1.5 0 003 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span class="badge">3</span>
        </button>

        <!-- User Avatar Dropdown -->
        <div class="user-menu">
          <button class="user-avatar" (click)="toggleUserMenu()">
            <div class="avatar-circle">
              {{ userInitials }}
            </div>
            <span class="user-name">{{ authService.currentUser()?.name || 'Admin' }}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="dropdown-menu" *ngIf="userMenuOpen">
            <a routerLink="/settings" class="dropdown-item" (click)="userMenuOpen = false">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Settings
            </a>
            <hr class="dropdown-divider" />
            <button class="dropdown-item danger" (click)="logout()">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() pageTitle = 'Dashboard';
  @Output() menuToggle = new EventEmitter<void>();

  authService = inject(AuthService);
  userMenuOpen = false;

  get userInitials(): string {
    const name = this.authService.currentUser()?.name || 'Admin';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
  }
}

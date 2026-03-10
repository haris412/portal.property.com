import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);

  toggleSidebar(): void {
    if (window.innerWidth <= 991.98) {
      this.mobileSidebarOpen.update((value) => !value);
      return;
    }

    this.sidebarCollapsed.update((value) => !value);
  }

  setSidebarCollapsed(value: boolean): void {
    this.sidebarCollapsed.set(value);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
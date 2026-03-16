import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  readonly pageTitle = input<string>('Dashboard');
  readonly menuToggle = output<void>();

  readonly authService = inject(AuthService);
  private readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  readonly userMenuOpen = signal(false);

  readonly userName = computed(() => this.currentUser()?.name || 'Admin');

  readonly userInitials = computed(() => {
    const name = this.userName();

    return name
      .split(' ')
      .map((part: string) => part[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleUserMenu(): void {
    this.userMenuOpen.update((value) => !value);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}
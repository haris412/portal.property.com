import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthHeroPanelComponent } from '../../components/auth-hero-panel/auth-hero-panel.component';

@Component({
  selector: 'app-forgot-password-shell',
  standalone: true,
  imports: [RouterOutlet, AuthHeroPanelComponent],
  templateUrl: './forgot-password-shell.component.html',
  styleUrl: './forgot-password-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordShellComponent {}

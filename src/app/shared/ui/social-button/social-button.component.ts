import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-social-button',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './social-button.component.html',
  styleUrl: './social-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialButtonComponent {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly pressed = output<void>();

  onClick(): void {
    this.pressed.emit();
  }
}
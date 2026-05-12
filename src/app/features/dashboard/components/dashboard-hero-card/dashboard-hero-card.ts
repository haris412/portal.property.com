import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-hero-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard-hero-card.html',
  styleUrl: './dashboard-hero-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHeroCardComponent {
  private readonly router = inject(Router);

  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly ctaLabel = input.required<string>();

  onCta(): void {
    this.router.navigate(['/add-listing']);
  }
}

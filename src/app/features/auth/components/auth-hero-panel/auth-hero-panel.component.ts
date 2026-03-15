import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { StatItem } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-auth-hero-panel',
  standalone: true,
  imports: [NgOptimizedImage, MatIconModule, BrandLogoComponent, StatCardComponent],
  templateUrl: './auth-hero-panel.component.html',
  styleUrl: './auth-hero-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthHeroPanelComponent {
  readonly stats = signal<StatItem[]>([
    { value: '18k+', label: 'Active properties' },
    { value: '2.4k', label: 'Verified agents' },
    { value: '95%', label: 'Client satisfaction' }
  ]);
}
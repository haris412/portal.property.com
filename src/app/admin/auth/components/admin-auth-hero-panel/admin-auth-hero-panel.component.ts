import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { StatItem } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-admin-auth-hero-panel',
  standalone: true,
  imports: [NgOptimizedImage, MatIconModule, BrandLogoComponent, StatCardComponent],
  templateUrl: './admin-auth-hero-panel.component.html',
  styleUrl: './admin-auth-hero-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAuthHeroPanelComponent {
  readonly stats = signal<StatItem[]>([
    { value: '24/7', label: 'Platform monitoring' },
    { value: 'Role-based', label: 'Access control' },
    { value: 'Audit-ready', label: 'Admin actions' },
  ]);
}

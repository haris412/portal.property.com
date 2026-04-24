import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { TranslateModule } from '@ngx-translate/core';

interface HeroStat { value: string; labelKey: string; }

@Component({
  selector: 'app-auth-hero-panel',
  standalone: true,
  imports: [TranslateModule, NgOptimizedImage, MatIconModule, BrandLogoComponent, StatCardComponent],
  templateUrl: './auth-hero-panel.component.html',
  styleUrl: './auth-hero-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthHeroPanelComponent {
  readonly stats = signal<HeroStat[]>([
    { value: '18k+', labelKey: 'public.hero.stats.properties' },
    { value: '2.4k', labelKey: 'public.hero.stats.agents' },
    { value: '95%',  labelKey: 'public.hero.stats.satisfaction' },
  ]);
}
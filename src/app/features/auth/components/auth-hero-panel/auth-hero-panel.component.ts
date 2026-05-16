import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-hero-panel',
  standalone: true,
  imports: [TranslateModule, NgOptimizedImage, BrandLogoComponent],
  templateUrl: './auth-hero-panel.component.html',
  styleUrl: './auth-hero-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthHeroPanelComponent {}

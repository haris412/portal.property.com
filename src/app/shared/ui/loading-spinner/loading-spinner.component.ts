import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/http/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
  @if (loading$ | async) {
    <div class="spinner-overlay" [class.fullscreen]="fullscreen">
      <div class="spinner-container">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      </div>
    </div>
}
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      &.fullscreen {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.85);
        z-index: 9999;
      }
    }
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .spinner {
  border: 3px solid var(--border-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner-text {
  color: var(--font-secondary);
  font-size: 0.875rem;
}
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() fullscreen = false;
  @Input() size = 40;

  private loadingService = inject<LoadingService>(LoadingService);

  loading$ = this.loadingService.loading$;
}

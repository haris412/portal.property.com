import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  input,
  output,
  signal
} from '@angular/core';

export interface SegmentedTabItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  templateUrl: './segmented-tabs.component.html',
  styleUrl: './segmented-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentedTabsComponent {
  readonly tabs = input.required<SegmentedTabItem[]>();
  readonly active = input.required<string>();
  readonly ariaLabel = input<string>('Segmented tabs');
  readonly switchDelayMs = input<number>(120);

  readonly changed = output<string>();

  readonly visualActive = signal<string>('');
  readonly isAnimating = signal(false);

  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly destroyRef: DestroyRef) {
    effect(() => {
      const active = this.active();

      if (!this.isAnimating()) {
        this.visualActive.set(active);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.pendingTimeoutId) {
        clearTimeout(this.pendingTimeoutId);
      }
    });
  }

  selectTab(next: string): void {
    if (next === this.active() || this.isAnimating()) {
      return;
    }

    if (this.pendingTimeoutId) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }

    this.isAnimating.set(true);
    this.visualActive.set(next);

    this.pendingTimeoutId = setTimeout(() => {
      this.changed.emit(next);
      this.isAnimating.set(false);
      this.pendingTimeoutId = null;
    }, this.switchDelayMs());
  }

  getPillTransform(): string {
    const items = this.tabs();
    const currentKey = this.visualActive();

    if (!items.length) {
      return 'translateX(0)';
    }

    const activeIndex = Math.max(
      items.findIndex(tab => tab.key === currentKey),
      0
    );

    return `translateX(${activeIndex * 100}%)`;
  }

  getGridTemplateColumns(): string {
    return `repeat(${this.tabs().length || 1}, 1fr)`;
  }

  getPillWidth(): string {
    const length = this.tabs().length || 1;
    return `calc((100% / ${length}) - 4px)`;
  }

  trackByKey(_: number, item: SegmentedTabItem): string {
    return item.key;
  }
}
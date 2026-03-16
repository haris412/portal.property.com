import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';

type AuthTab = 'signup' | 'login';

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  templateUrl: './segmented-tabs.component.html',
  styleUrl: './segmented-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentedTabsComponent {
  readonly active = input.required<AuthTab>();
  readonly changed = output<AuthTab>();

  readonly visualActive = signal<AuthTab>('signup');
  readonly isAnimating = signal(false);

  private switchDelayMs = 120;
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.visualActive.set(this.active());
  }

  ngOnChanges(): void {
    if (!this.isAnimating()) {
      this.visualActive.set(this.active());
    }
  }

  selectTab(next: AuthTab): void {
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
    }, this.switchDelayMs);
  }
}
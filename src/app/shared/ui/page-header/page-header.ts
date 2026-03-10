import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PageHeaderAction {
  id: string;
  label: string;
  variant?: 'text' | 'stroked' | 'flat';
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-page-header',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly meta = input<string>('');
  readonly actions = input<readonly PageHeaderAction[]>([]);

  readonly actionClicked = output<string>();

  onActionClick(actionId: string): void {
    this.actionClicked.emit(actionId);
  }

  trackByActionId(_: number, action: PageHeaderAction): string {
    return action.id;
  }
}
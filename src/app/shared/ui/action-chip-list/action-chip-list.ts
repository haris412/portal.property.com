import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionChipData } from '../../../core/models/ui.models';

@Component({
  selector: 'app-action-chip-list',
  templateUrl: './action-chip-list.html',
  styleUrl: './action-chip-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionChipListComponent {
  readonly items = input.required<readonly ActionChipData[]>();
  readonly actionClicked = output<string>();
}
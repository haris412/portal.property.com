import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SelectableChipItem } from '../../../core/models/ui.models';

@Component({
  selector: 'app-selectable-chip-grid',
  imports: [MatIconModule],
  templateUrl: './selectable-chip-grid.html',
  styleUrl: './selectable-chip-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectableChipGridComponent {
  readonly items = input.required<readonly SelectableChipItem[]>();
  readonly toggled = output<string>();
}
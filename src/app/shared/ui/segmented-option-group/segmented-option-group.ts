import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OptionItem } from '../../../core/interfaces/ui.models';

@Component({
  selector: 'app-segmented-option-group',
  templateUrl: './segmented-option-group.html',
  styleUrl: './segmented-option-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentedOptionGroupComponent {
  readonly items = input.required<readonly OptionItem[]>();
  readonly selectedValue = input.required<string>();
  readonly changed = output<string>();
}
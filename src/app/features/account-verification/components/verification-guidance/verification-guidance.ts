import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-verification-guidance',
  standalone: true,
  templateUrl: './verification-guidance.html',
  styleUrl: './verification-guidance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationGuidanceComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly exampleTitle = input.required<string>();
  readonly exampleDescription = input.required<string>();
  readonly exampleImage = input.required<string>();
  readonly exampleAlt = input.required<string>();
  readonly exampleCaption = input.required<string>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-verification-step-layout',
  standalone: true,
  templateUrl: './verification-step-layout.html',
  styleUrl: './verification-step-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationStepLayoutComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}

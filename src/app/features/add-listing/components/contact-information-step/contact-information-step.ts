import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepCardComponent } from '../../../../shared/ui/step-card/step-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';

@Component({
  selector: 'app-contact-information-step',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    StepCardComponent,
    InfoBannerComponent,
  ],
  templateUrl: './contact-information-step.html',
  styleUrl: './contact-information-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformationStepComponent implements OnInit {
  @Input({ required: true }) form!: FormGroup;

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly contactBanner = signal(
    'These contact details will be shown to buyers and renters, so keeping them together improves flow and completion.'
  );

  ngOnInit(): void {
    const name = this.form.get('contactName');
    const email = this.form.get('contactEmail');
    const phone = this.form.get('contactPhoneNumber');
    const streams = [name, email, phone].filter(Boolean).map((c) => merge(c!.valueChanges, c!.statusChanges));
    if (streams.length) {
      merge(...streams)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cdr.markForCheck());
    }
  }

  markContactTouched(control: 'contactName' | 'contactEmail' | 'contactPhoneNumber'): void {
    this.form.get(control)?.markAsTouched();
    this.cdr.markForCheck();
  }
}

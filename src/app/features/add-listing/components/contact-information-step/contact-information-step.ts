import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepCardComponent } from '../../../../shared/ui/step-card/step-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-contact-information-step',
  imports: [
    TranslateModule,
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
  private readonly translate = inject(TranslateService);

  readonly contactBanner = toSignal(
    this.translate.stream('addListing.contact.banner'),
    { initialValue: '' }
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

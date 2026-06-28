import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact-information-step',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaterialIntlTelInputComponent,
    SectionCardComponent,
    InfoBannerComponent,
  ],
  templateUrl: './contact-information-step.html',
  styleUrl: './contact-information-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformationStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form    = this.buildForm();
  readonly isValid = toSignal(this.form.statusChanges.pipe(startWith(this.form.status), map(s => s === 'VALID')), { initialValue: this.form.valid });

  // parent receives the form reference once, on init
  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    console.log('[Contact] init');
    this.formReady.emit(this.form);
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    // contactPhoneNumber is stored under several legacy aliases depending on API version
    const contactPhoneNumber = (doc.contactPhoneNumber ?? doc.contactPhone ?? doc.phone ?? '').toString();
    this.form.patchValue({
      contactName:        doc.contactName     ?? '',
      contactEmail:       doc.contactEmail    ?? '',
      contactPhoneNumber,
      contactLocation:    doc.contactLocation ?? '',
    });
  }

  // —— private ——

  private buildForm() {
    const form = this.fb.nonNullable.group({
      contactName:        ['', Validators.required],
      contactEmail:       ['', [Validators.required, Validators.email]],
      contactPhoneNumber: ['', Validators.required],  // format validated by ngx-material-intl-tel-input
      contactLocation:    [''],
    });

    return form;
  }
}

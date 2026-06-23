import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
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
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // declared before buildForm() — buildForm() subscribes to statusChanges immediately
  readonly canContinue = signal(false);
  readonly form        = this.buildForm();

  // parent receives the form reference once, on init
  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    console.log('[Contact] init');
    this.formReady.emit(this.form);
  }

  // —— private ——

  private buildForm() {
    const form = this.fb.nonNullable.group({
      contactName:        ['', Validators.required],
      contactEmail:       ['', [Validators.required, Validators.email]],
      contactPhoneNumber: ['', Validators.required],  // format validated by ngx-material-intl-tel-input
      contactLocation:    [''],
    });

    // gate the Continue button
    form.statusChanges
      .pipe(startWith(form.status), takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.canContinue.set(status === 'VALID'));

    return form;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { ActionChipData } from '../../../../core/interfaces/ui.models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AddListingService, GenerateListingDescriptionRequest } from '../../../../core/services/add-listing.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';

@Component({
  selector: 'app-property-description-step',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SectionCardComponent,
    InfoBannerComponent,
    ActionChipListComponent,
  ],
  templateUrl: './property-description-step.html',
  styleUrl: './property-description-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDescriptionStepComponent implements OnInit {
  private readonly fb            = inject(FormBuilder);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly translate     = inject(TranslateService);
  private readonly addListing    = inject(AddListingService);
  private readonly notifications = inject(NotificationService);

  readonly aiRequestBody = input<GenerateListingDescriptionRequest | null>(null);

  @Output() readonly formReady = new EventEmitter<FormGroup>();

  readonly form                    = this.buildForm();
  readonly isGeneratingDescription = signal(false);

  readonly descriptionBanner = toSignal(
    this.translate.stream('addListing.description.banner'),
    { initialValue: '' }
  );

  readonly descriptionActions = computed<readonly ActionChipData[]>(() => {
    const enabled = this.aiRequestBody() != null;
    const loading = this.isGeneratingDescription();
    return [
      {
        id:       'generate-description',
        label:    loading ? 'Generating description…' : 'Ask AI to generate description',
        disabled: !enabled || loading,
      },
    ];
  });

  ngOnInit(): void {
    this.formReady.emit(this.form);
  }

  onDescriptionAction(id: string): void {
    if (id !== 'generate-description') return;
    const body = this.aiRequestBody();
    if (!body || this.isGeneratingDescription()) return;

    this.isGeneratingDescription.set(true);
    this.addListing.generateListingDescription(body)
      .pipe(
        finalize(() => this.isGeneratingDescription.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: text => {
          if (!text) { this.notifications.warning('No description text was returned.'); return; }
          this.form.patchValue({ propertyDescription: text });
          this.notifications.success('Description added — review and edit if needed.');
        },
        error: (err: unknown) => this.notifications.error(apiErrorSummary(err) || 'Could not generate description.'),
      });
  }

  private buildForm(): FormGroup {
    return this.fb.nonNullable.group({
      propertyDescription: ['', [Validators.required, Validators.minLength(20)]],
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { NotificationService } from '../../../../core/services/notification.service';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import {
  SHARED_BATHROOM_OPTIONS,
  SHARED_ENTRANCE_OPTIONS,
  SHARED_KITCHEN_OPTIONS,
  SHARED_LAUNDRY_OPTIONS,
  SHARED_LIVING_ROOM_OPTIONS,
  SHARED_TENANT_PREFERENCE_OPTIONS,
  isSharedProperty,
  type SharedDetails,
} from '../../../../core/models/shared-listing.model';

const DETAIL_DEFAULTS = {
  roomsAvailable:    null,
  bathroom:          '',
  kitchen:           '',
  livingRoom:        '',
  laundry:           '',
  entrance:          '',
  currentOccupants:  null,
  tenantPreference:  'Any',
  utilitiesIncluded: false,
} as const;

@Component({
  selector: 'app-shared-listing-section',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    SectionCardComponent,
  ],
  templateUrl: './shared-listing-section.html',
  styleUrl: './shared-listing-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedListingSectionComponent implements OnInit {
  private readonly fb            = inject(FormBuilder);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);

  /** true = purpose is For Rent and subtype slug is house/flat; null = not known yet (catalog loading). */
  readonly eligible      = input<boolean | null>(null);

  readonly form    = this.buildForm();
  readonly isValid = toSignal(this.form.statusChanges.pipe(startWith(this.form.status), map(s => s === 'VALID')), { initialValue: this.form.valid });

  readonly bathroomOptions         = SHARED_BATHROOM_OPTIONS;
  readonly kitchenOptions          = SHARED_KITCHEN_OPTIONS;
  readonly livingRoomOptions       = SHARED_LIVING_ROOM_OPTIONS;
  readonly laundryOptions          = SHARED_LAUNDRY_OPTIONS;
  readonly entranceOptions         = SHARED_ENTRANCE_OPTIONS;
  readonly tenantPreferenceOptions = SHARED_TENANT_PREFERENCE_OPTIONS;

  @Output() readonly formReady = new EventEmitter<FormGroup>();

  constructor() {
    // purpose/subtype moved away from For Rent + House/Flat: shared is no longer allowed
    effect(() => {
      if (this.eligible() !== false) return;
      untracked(() => {
        if (!this.form.controls.isShared.value) return;
        this.turnOffAndClear();
        this.notifications.warning('Shared listing was turned off. It is only available for a House or Flat that is For Rent.');
      });
    });
  }

  ngOnInit(): void {
    this.formReady.emit(this.form);
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    const details: Partial<SharedDetails> = doc.sharedDetails ?? {};
    this.form.patchValue({
      isShared: isSharedProperty(doc),
      details: {
        roomsAvailable:    details.roomsAvailable    ?? DETAIL_DEFAULTS.roomsAvailable,
        bathroom:          details.bathroom          ?? DETAIL_DEFAULTS.bathroom,
        kitchen:           details.kitchen           ?? DETAIL_DEFAULTS.kitchen,
        livingRoom:        details.livingRoom        ?? DETAIL_DEFAULTS.livingRoom,
        laundry:           details.laundry           ?? DETAIL_DEFAULTS.laundry,
        entrance:          details.entrance          ?? DETAIL_DEFAULTS.entrance,
        currentOccupants:  details.currentOccupants  ?? DETAIL_DEFAULTS.currentOccupants,
        tenantPreference:  details.tenantPreference  ?? DETAIL_DEFAULTS.tenantPreference,
        utilitiesIncluded: details.utilitiesIncluded ?? DETAIL_DEFAULTS.utilitiesIncluded,
      },
    }, { emitEvent: false });
    // emitEvent:false skips the isShared subscription, so sync the details enabled state manually
    this.syncDetailsEnabled(this.form.controls.isShared.value);
  }

  // prevents user typing '-' into number inputs (same as pricing step)
  blockMinus(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '−' || event.code === 'NumpadSubtract') {
      event.preventDefault();
    }
  }

  private turnOffAndClear(): void {
    this.form.controls.details.reset(DETAIL_DEFAULTS);
    this.form.controls.isShared.setValue(false);
  }

  // disabled controls don't count towards validity, so the required fields only apply while shared is on
  private syncDetailsEnabled(isShared: boolean): void {
    const details = this.form.controls.details;
    isShared ? details.enable() : details.disable();
  }

  private buildForm() {
    const form = this.fb.group({
      isShared: this.fb.nonNullable.control(false),
      details: this.fb.group({
        roomsAvailable:    this.fb.control<number | null>(DETAIL_DEFAULTS.roomsAvailable, [
          Validators.required, Validators.min(1), Validators.pattern(/^\d+$/),
        ]),
        bathroom:          this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.bathroom, Validators.required),
        kitchen:           this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.kitchen,  Validators.required),
        livingRoom:        this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.livingRoom),
        laundry:           this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.laundry),
        entrance:          this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.entrance),
        currentOccupants:  this.fb.control<number | null>(DETAIL_DEFAULTS.currentOccupants, [Validators.min(0), Validators.pattern(/^\d+$/)]),
        tenantPreference:  this.fb.nonNullable.control<string>(DETAIL_DEFAULTS.tenantPreference),
        utilitiesIncluded: this.fb.nonNullable.control<boolean>(DETAIL_DEFAULTS.utilitiesIncluded),
      }),
    });
    form.controls.details.disable();

    form.controls.isShared.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isShared => this.syncDetailsEnabled(isShared));

    return form;
  }
}

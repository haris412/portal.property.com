import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { AgentDayAvailability } from '../../../../core/models/profile.models';
import {
  UserAvailabilityService,
  defaultWeekAvailability,
  mergeWeekWithDefaults
} from '../../../../core/services/user-availability.service';
import { ActionButtonComponent } from "../../../../shared/ui/action-button/action-button";

@Component({
  selector: 'app-profile-availability-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    ActionButtonComponent
],
  templateUrl: './profile-availability-section.html',
  styleUrl: './profile-availability-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAvailabilitySection implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly availabilityService = inject(UserAvailabilityService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * When null, uses `GET/PUT /api/users/me/availability`.
   * When set, uses `GET/PUT /api/users/:userId/availability`.
   */
  readonly availabilityUserId = input<string | null>(null);

  @Output() readonly saved = new EventEmitter<AgentDayAvailability[]>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    days: this.fb.array<FormGroup>([])
  });

  get days(): FormArray<FormGroup> {
    return this.form.get('days') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.loadFromApi();
  }

  loadFromApi(): void {
    this.loading.set(true);
    this.error.set(null);
    this.availabilityService
      .getAvailability(this.availabilityUserId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (apiDays) => {
          const defaults = defaultWeekAvailability();
          const merged =
            apiDays.length > 0 ? mergeWeekWithDefaults(apiDays, defaults) : defaults;
          this.patchDays(merged);
          this.cdr.markForCheck();
        },
        error: () => {
          this.error.set('Could not load availability. Showing defaults until save.');
          this.patchDays(defaultWeekAvailability());
          this.cdr.markForCheck();
        }
      });
  }

  save(): void {
    if (this.loading() || this.saving()) return;

    const week = this.days.getRawValue() as AgentDayAvailability[];
    this.saving.set(true);
    this.error.set(null);

    this.availabilityService
      .updateAvailability(this.availabilityUserId(), week)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.saved.emit(week);
        },
        error: () => {
          this.error.set('Could not save availability. Please try again.');
        }
      });
  }

  private patchDays(items: AgentDayAvailability[]): void {
    this.days.clear();
    for (const item of items) {
      this.days.push(
        this.fb.group({
          day: [item.day],
          enabled: [item.enabled],
          startTime: [item.startTime],
          endTime: [item.endTime]
        })
      );
    }
  }
}

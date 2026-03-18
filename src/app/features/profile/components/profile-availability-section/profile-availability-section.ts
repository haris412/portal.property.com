import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AgentDayAvailability } from '../../../../core/models/profile.models';

@Component({
  selector: 'app-profile-availability-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './profile-availability-section.html',
  styleUrl: './profile-availability-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAvailabilitySection {
  private readonly fb = inject(FormBuilder);

  readonly availability = input<AgentDayAvailability[]>([]);

  @Output() readonly saved = new EventEmitter<AgentDayAvailability[]>();

  readonly form = this.fb.group({
    days: this.fb.array<FormGroup>([])
  });

  get days(): FormArray<FormGroup> {
    return this.form.get('days') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.days.clear();

    for (const item of this.availability()) {
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

  save(): void {
    this.saved.emit(this.days.getRawValue() as AgentDayAvailability[]);
  }
}
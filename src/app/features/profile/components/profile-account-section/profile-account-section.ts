import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserProfileModel } from '../../../../core/models/profile.models';

@Component({
  selector: 'app-profile-account-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './profile-account-section.html',
  styleUrl: './profile-account-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAccountSection {
  private readonly fb = inject(FormBuilder);

  readonly profile = input.required<UserProfileModel>();

  @Output() readonly saved = new EventEmitter<Partial<UserProfileModel>>();

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    title: [''],
    company: [''],
    location: [''],
    bio: ['']
  });

  ngOnInit(): void {
    const profile = this.profile();

    this.form.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      title: profile.title || '',
      company: profile.company || '',
      location: profile.location || '',
      bio: profile.bio || ''
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit(this.form.getRawValue());
  }
}
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FeatureCardComponent } from '../../../../shared/ui/feature-card/feature-card.component';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { FeatureItem } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    FeatureCardComponent,
    SocialButtonComponent,
    FormFieldErrorComponent
  ],
  templateUrl: './login-card.component.html',
  styleUrl: './login-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginCardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  private readonly bothFieldsFilled = signal(false);

  readonly features = signal<FeatureItem[]>([
    {
      icon: 'favorite_border',
      title: 'Saved properties',
      description: 'Return to your shortlisted homes and rental picks instantly.'
    },
    {
      icon: 'videocam',
      title: 'Video tours',
      description: 'Resume property walkthroughs and media uploads from the dashboard.'
    },
    {
      icon: 'apartment',
      title: 'Manage listings',
      description: 'Track buyer inquiries, schedule visits and update listing details.'
    }
  ]);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  constructor() {
    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const { identifier, password } = this.form.getRawValue();
        const filled =
          (identifier?.trim() ?? '').length > 0 && (password?.length ?? 0) > 0;
        this.bothFieldsFilled.set(filled);
      });
  }

  readonly canSubmit = computed(
    () => this.bothFieldsFilled() && !this.loading()
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const { identifier, password } = this.form.getRawValue();
    const payload = {
      email: identifier.trim(),
      password
    };
    this.auth.login(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          (err as { message?: string }).message ??
            'Login failed. Please try again.'
        );
      },
      complete: () => this.loading.set(false)
    });
  }
}
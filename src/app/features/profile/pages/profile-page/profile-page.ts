import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ProfileShellComponent } from '../../components/profile-shell/profile-shell';
import { AgentDayAvailability, UserProfileModel } from '../../../../core/models/profile.models';
import { AuthService } from '../../../../core/services/auth.service';

const DEFAULT_AVAILABILITY: AgentDayAvailability[] = [
  { day: 'Monday',    enabled: true,  startTime: '09:00', endTime: '18:00' },
  { day: 'Tuesday',   enabled: true,  startTime: '09:00', endTime: '18:00' },
  { day: 'Wednesday', enabled: true,  startTime: '09:00', endTime: '18:00' },
  { day: 'Thursday',  enabled: true,  startTime: '09:00', endTime: '18:00' },
  { day: 'Friday',    enabled: true,  startTime: '09:00', endTime: '18:00' },
  { day: 'Saturday',  enabled: true,  startTime: '10:00', endTime: '15:00' },
  { day: 'Sunday',    enabled: false, startTime: '10:00', endTime: '15:00' },
];

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfileShellComponent],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly auth = inject(AuthService);
  private readonly currentUser = toSignal(this.auth.currentUser$);

  readonly profile = signal<UserProfileModel>(this.mapUserToProfile());

  constructor() {
    const id = this.auth.getUserId();
    if (!id) return;

    // Fetch full profile once — populates email, phone, location, avatar from API
    this.auth.fetchUserProfile(id)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        // Preserve availability edits — only update user fields from the API response
        this.profile.update((current) => ({
          ...this.mapUserToProfile(),
          availability: current.availability,
        }));
      });
  }

  onAccountSaved(payload: Partial<UserProfileModel>): void {
    this.profile.update((current) => ({ ...current, ...payload }));
  }

  onPasswordChanged(_payload: { currentPassword: string; newPassword: string; confirmPassword: string }): void {
    // TODO: wire up change password API
  }

  onAvailabilitySaved(payload: AgentDayAvailability[]): void {
    this.profile.update((current) => ({ ...current, availability: payload }));
  }

  private mapUserToProfile(): UserProfileModel {
    const u = this.currentUser();
    return {
      id:           u?._id            ?? '',
      role:         'agent',
      firstName:    u?.firstName      ?? '',
      lastName:     u?.lastName       ?? '',
      email:        u?.email          ?? '',
      phone:        u?.phoneNumber    ?? '',
      location:     u?.location       ?? '',
      avatarUrl:    u?.profileImageUrl,
      bio:          '',
      company:      '',
      availability: DEFAULT_AVAILABILITY,
    };
  }
}

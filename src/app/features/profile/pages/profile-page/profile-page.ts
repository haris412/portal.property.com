import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ProfileShellComponent } from '../../components/profile-shell/profile-shell';
import {
  AgentDayAvailability,
  UserProfileModel
} from '../../../../core/models/profile.models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfileShellComponent],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  readonly profile = signal<UserProfileModel>({
    id: 'user-001',
    role: 'agent',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.jenkins@locatehome.com',
    phone: '+1 (555) 123-4567',
    bio: 'Helping buyers and renters discover premium homes with a smooth, transparent experience.',
    company: 'LocateHome Realty',
    title: 'Senior Property Consultant',
    location: 'Toronto, Ontario',
    avatarUrl: 'assets/images/agents/agent-1.jpg',
    availability: this.buildDefaultAvailability()
  });

  onAccountSaved(payload: Partial<UserProfileModel>): void {
    this.profile.update((current) => ({
      ...current,
      ...payload
    }));

    console.log('account saved', payload);
  }

  onPasswordChanged(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): void {
    console.log('password changed', payload);
  }

  onAvailabilitySaved(payload: AgentDayAvailability[]): void {
    this.profile.update((current) => ({
      ...current,
      availability: payload
    }));

    console.log('availability saved', payload);
  }

  private buildDefaultAvailability(): AgentDayAvailability[] {
    return [
      { day: 'Monday', enabled: true, startTime: '09:00', endTime: '18:00' },
      { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '18:00' },
      { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '18:00' },
      { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '18:00' },
      { day: 'Friday', enabled: true, startTime: '09:00', endTime: '18:00' },
      { day: 'Saturday', enabled: true, startTime: '10:00', endTime: '15:00' },
      { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '15:00' }
    ];
  }
}
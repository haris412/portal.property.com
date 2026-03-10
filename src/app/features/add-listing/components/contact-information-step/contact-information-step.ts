import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepCardComponent } from '../../../../shared/ui/step-card/step-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';

interface ContactField {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'email' | 'tel';
}

@Component({
  selector: 'app-contact-information-step',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    StepCardComponent,
    InfoBannerComponent
  ],
  templateUrl: './contact-information-step.html',
  styleUrl: './contact-information-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactInformationStepComponent {
  readonly contactBanner = signal(
    'These contact details will be shown to buyers and renters, so keeping them together improves flow and completion.'
  );

  readonly fields = signal<ContactField[]>([
    {
      id: 'name',
      label: 'Contact Name',
      placeholder: 'Enter full name',
      type: 'text'
    },
    {
      id: 'email',
      label: 'Contact Email',
      placeholder: 'Enter email address',
      type: 'email'
    },
    {
      id: 'phone',
      label: 'Contact Phone Number',
      placeholder: 'Enter mobile or WhatsApp number',
      type: 'tel'
    },
    {
      id: 'location',
      label: 'Contact Location',
      placeholder: 'Enter office, branch or contact location',
      type: 'text'
    }
  ]);
}
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepCardComponent } from '../../../../shared/ui/step-card/step-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { LocationMapPickerComponent } from '../location-map-picker/location-map-picker';

interface LocationField {
  id: string;
  label: string;
  placeholder: string;
}

@Component({
  selector: 'app-property-location-step',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    StepCardComponent,
    InfoBannerComponent,
    LocationMapPickerComponent
  ],
  templateUrl: './property-location-step.html',
  styleUrl: './property-location-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyLocationStepComponent {
  @Input({ required: true }) form!: FormGroup;
  readonly locationBanner = signal(
    'Start broad with city and neighborhood, then add the full address and map reference for more accurate discovery.'
  );

  readonly fields = signal<LocationField[]>([
    {
      id: 'city',
      label: 'City / Location',
      placeholder: 'Enter city, town or location'
    },
    {
      id: 'area',
      label: 'Area / Neighborhood',
      placeholder: 'Enter area, sector or neighborhood'
    },
    {
      id: 'address',
      label: 'Full Property Address',
      placeholder: 'Enter complete address'
    },
    {
      id: 'map-link',
      label: 'Pin Location / Map Link',
      placeholder: 'Paste Google Maps pin or coordinates'
    }
  ]);
}
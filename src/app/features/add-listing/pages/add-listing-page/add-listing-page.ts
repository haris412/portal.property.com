import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { BasicInformationSectionComponent } from '../../components/basic-information-section/basic-information-section';
import { PricingDetailsSectionComponent } from '../../components/pricing-details-section/pricing-details-section';
import { FeaturesAmenitiesSectionComponent } from '../../components/features-amenities-section/features-amenities-section';
import { PropertyMediaSectionComponent } from '../../components/property-media-section/property-media-section';
import { PropertyLocationStepComponent } from '../../components/property-location-step/property-location-step';
import { ContactInformationStepComponent } from '../../components/contact-information-step/contact-information-step';

@Component({
  selector: 'app-add-listing-page',
  imports: [
    PageHeaderComponent,
    BasicInformationSectionComponent,
    PricingDetailsSectionComponent,
    FeaturesAmenitiesSectionComponent,
    PropertyMediaSectionComponent,
    PropertyLocationStepComponent,
    ContactInformationStepComponent
  ],
  templateUrl: './add-listing-page.html',
  styleUrl: './add-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddListingPageComponent {
  readonly pageActions = signal<readonly PageHeaderAction[]>([
    {
      id: 'save-draft',
      label: 'Save Draft',
      variant: 'stroked'
    },
    {
      id: 'publish-listing',
      label: 'Publish Listing',
      variant: 'flat'
    }
  ]);

  onHeaderAction(actionId: string): void {
    console.log('Header action:', actionId);
  }
}
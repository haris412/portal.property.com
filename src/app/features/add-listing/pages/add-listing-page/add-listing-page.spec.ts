import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddListingPage } from './add-listing-page';

describe('AddListingPage', () => {
  let component: AddListingPage;
  let fixture: ComponentFixture<AddListingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddListingPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddListingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

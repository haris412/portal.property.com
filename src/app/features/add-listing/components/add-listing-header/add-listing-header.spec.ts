import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddListingHeader } from './add-listing-header';

describe('AddListingHeader', () => {
  let component: AddListingHeader;
  let fixture: ComponentFixture<AddListingHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddListingHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(AddListingHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

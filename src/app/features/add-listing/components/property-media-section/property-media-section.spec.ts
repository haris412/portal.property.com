import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyMediaSection } from './property-media-section';

describe('PropertyMediaSection', () => {
  let component: PropertyMediaSection;
  let fixture: ComponentFixture<PropertyMediaSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyMediaSection],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyMediaSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

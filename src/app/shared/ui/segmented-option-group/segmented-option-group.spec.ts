import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentedOptionGroup } from './segmented-option-group';

describe('SegmentedOptionGroup', () => {
  let component: SegmentedOptionGroup;
  let fixture: ComponentFixture<SegmentedOptionGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedOptionGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentedOptionGroup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

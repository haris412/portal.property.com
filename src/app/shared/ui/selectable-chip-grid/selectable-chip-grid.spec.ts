import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectableChipGrid } from './selectable-chip-grid';

describe('SelectableChipGrid', () => {
  let component: SelectableChipGrid;
  let fixture: ComponentFixture<SelectableChipGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectableChipGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectableChipGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

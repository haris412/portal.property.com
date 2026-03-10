import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionChipList } from './action-chip-list';

describe('ActionChipList', () => {
  let component: ActionChipList;
  let fixture: ComponentFixture<ActionChipList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionChipList],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionChipList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

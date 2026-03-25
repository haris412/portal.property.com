import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatChip } from './stat-chip';

describe('StatChip', () => {
  let component: StatChip;
  let fixture: ComponentFixture<StatChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatChip],
    }).compileComponents();

    fixture = TestBed.createComponent(StatChip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

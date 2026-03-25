import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartPanel } from './chart-panel';

describe('ChartPanel', () => {
  let component: ChartPanel;
  let fixture: ComponentFixture<ChartPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

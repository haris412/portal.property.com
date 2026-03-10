import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterField } from './counter-field';

describe('CounterField', () => {
  let component: CounterField;
  let fixture: ComponentFixture<CounterField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterField],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterField);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

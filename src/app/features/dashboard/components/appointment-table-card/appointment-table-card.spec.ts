import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentTableCard } from './appointment-table-card';

describe('AppointmentTableCard', () => {
  let component: AppointmentTableCard;
  let fixture: ComponentFixture<AppointmentTableCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentTableCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentTableCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

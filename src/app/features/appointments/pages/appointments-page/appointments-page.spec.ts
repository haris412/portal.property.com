import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsPageComponent } from './appointments-page';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { AuthService, User } from '../../../../core/services/auth.service';

describe('AppointmentsPageComponent', () => {
  let component: AppointmentsPageComponent;
  let fixture: ComponentFixture<AppointmentsPageComponent>;

  const mockUser: User = {
    _id: '69cec2d7fbfdacec99e4bb98',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(mockUser)
          }
        },
        {
          provide: AppointmentsService,
          useValue: {
            getByUserId: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

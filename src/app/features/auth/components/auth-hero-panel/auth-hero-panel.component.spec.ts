import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthHeroPanelComponent } from './auth-hero-panel.component';

describe('AuthHeroPanelComponent', () => {
  let component: AuthHeroPanelComponent;
  let fixture: ComponentFixture<AuthHeroPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthHeroPanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthHeroPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

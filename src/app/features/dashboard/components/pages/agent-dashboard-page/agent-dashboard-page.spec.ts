import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentDashboardPage } from './agent-dashboard-page';

describe('AgentDashboardPage', () => {
  let component: AgentDashboardPage;
  let fixture: ComponentFixture<AgentDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentDashboardPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialButtonComponent } from './social-button.component';

describe('SocialButtonComponent', () => {
  let component: SocialButtonComponent;
  let fixture: ComponentFixture<SocialButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialButtonComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('label', 'Google');
    fixture.componentRef.setInput('icon', 'google');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentTabsComponent } from './segmented-tabs.component';

describe('SegmentTabsComponent', () => {
  let component: SegmentTabsComponent;
  let fixture: ComponentFixture<SegmentTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentTabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentTabsComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('active', 'signup');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

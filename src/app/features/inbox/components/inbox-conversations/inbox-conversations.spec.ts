import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxConversations } from './inbox-conversations';

describe('InboxConversations', () => {
  let component: InboxConversations;
  let fixture: ComponentFixture<InboxConversations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxConversations],
    }).compileComponents();

    fixture = TestBed.createComponent(InboxConversations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

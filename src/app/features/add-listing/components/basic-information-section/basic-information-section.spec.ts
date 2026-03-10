import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicInformationSection } from './basic-information-section';

describe('BasicInformationSection', () => {
  let component: BasicInformationSection;
  let fixture: ComponentFixture<BasicInformationSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicInformationSection],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicInformationSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqDetailsSection } from './faq-details-section';

describe('FaqDetailsSection', () => {
  let component: FaqDetailsSection;
  let fixture: ComponentFixture<FaqDetailsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqDetailsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqDetailsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqCategoriesSection } from './faq-categories-section';

describe('FaqCategoriesSection', () => {
  let component: FaqCategoriesSection;
  let fixture: ComponentFixture<FaqCategoriesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqCategoriesSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqCategoriesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

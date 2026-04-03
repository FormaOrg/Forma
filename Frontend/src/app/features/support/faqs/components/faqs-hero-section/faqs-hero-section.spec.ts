import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqsHeroSection } from './faqs-hero-section';

describe('FaqsHeroSection', () => {
  let component: FaqsHeroSection;
  let fixture: ComponentFixture<FaqsHeroSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqsHeroSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqsHeroSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

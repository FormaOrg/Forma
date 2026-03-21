import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FasqHeroSection } from './faqs-hero-section';

describe('FasqHeroSection', () => {
  let component: FasqHeroSection;
  let fixture: ComponentFixture<FasqHeroSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FasqHeroSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FasqHeroSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

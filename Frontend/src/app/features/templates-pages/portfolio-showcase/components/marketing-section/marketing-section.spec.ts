import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketingSection } from './marketing-section';

describe('MarketingSection', () => {
  let component: MarketingSection;
  let fixture: ComponentFixture<MarketingSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketingSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

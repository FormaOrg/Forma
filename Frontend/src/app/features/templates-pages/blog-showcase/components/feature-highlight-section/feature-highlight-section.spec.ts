import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureHighlightSection } from './feature-highlight-section';

describe('FeatureHighlightSection', () => {
  let component: FeatureHighlightSection;
  let fixture: ComponentFixture<FeatureHighlightSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureHighlightSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureHighlightSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

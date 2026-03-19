import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParallaxSection } from './parallax-section';

describe('ParallaxSection', () => {
  let component: ParallaxSection;
  let fixture: ComponentFixture<ParallaxSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParallaxSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParallaxSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

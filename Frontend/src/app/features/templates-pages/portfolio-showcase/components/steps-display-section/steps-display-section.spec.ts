import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepsDisplaySection } from './steps-display-section';

describe('StepsDisplaySection', () => {
  let component: StepsDisplaySection;
  let fixture: ComponentFixture<StepsDisplaySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepsDisplaySection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepsDisplaySection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

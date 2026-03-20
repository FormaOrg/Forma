import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningStages } from './learning-stages';

describe('LearningStages', () => {
  let component: LearningStages;
  let fixture: ComponentFixture<LearningStages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningStages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningStages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

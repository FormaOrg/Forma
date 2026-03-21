import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularQuestions } from './popular-questions';

describe('PopularQuestions', () => {
  let component: PopularQuestions;
  let fixture: ComponentFixture<PopularQuestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularQuestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularQuestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

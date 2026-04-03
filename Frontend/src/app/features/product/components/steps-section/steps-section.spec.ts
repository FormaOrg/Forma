import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepsSection2 } from './steps-section';

describe('StepsSection2', () => {
  let component: StepsSection2;
  let fixture: ComponentFixture<StepsSection2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepsSection2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepsSection2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

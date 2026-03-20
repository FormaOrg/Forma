import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesSection } from './courses-section';

describe('CoursesSection', () => {
  let component: CoursesSection;
  let fixture: ComponentFixture<CoursesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

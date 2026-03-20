import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialsMainSection } from './tutorials-main-section';

describe('TutorialsMainSection', () => {
  let component: TutorialsMainSection;
  let fixture: ComponentFixture<TutorialsMainSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorialsMainSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorialsMainSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

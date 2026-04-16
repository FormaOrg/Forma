import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamplesSection } from './examples-section';

describe('ExamplesSection', () => {
  let component: ExamplesSection;
  let fixture: ComponentFixture<ExamplesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamplesSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamplesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

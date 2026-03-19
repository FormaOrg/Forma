import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateSection } from './template-section';

describe('TemplateSection', () => {
  let component: TemplateSection;
  let fixture: ComponentFixture<TemplateSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

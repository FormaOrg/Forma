import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateGallery } from './template-gallery';

describe('TemplateGallery', () => {
  let component: TemplateGallery;
  let fixture: ComponentFixture<TemplateGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

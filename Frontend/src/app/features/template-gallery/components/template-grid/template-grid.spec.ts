import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateGrid } from './template-grid';

describe('TemplateGrid', () => {
  let component: TemplateGrid;
  let fixture: ComponentFixture<TemplateGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

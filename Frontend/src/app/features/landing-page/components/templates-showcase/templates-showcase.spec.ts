import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesShowcase } from './templates-showcase';

describe('TemplatesShowcase', () => {
  let component: TemplatesShowcase;
  let fixture: ComponentFixture<TemplatesShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplatesShowcase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplatesShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

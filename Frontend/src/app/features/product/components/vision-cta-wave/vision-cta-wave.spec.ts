import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductVisionCtaWave } from './vision-cta-wave';

describe('ProductVisionCtaWave', () => {
  let component: ProductVisionCtaWave;
  let fixture: ComponentFixture<ProductVisionCtaWave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductVisionCtaWave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductVisionCtaWave);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

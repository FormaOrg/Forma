import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsSection } from './products-section';

describe('ProductsSection', () => {
  let component: ProductsSection;
  let fixture: ComponentFixture<ProductsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

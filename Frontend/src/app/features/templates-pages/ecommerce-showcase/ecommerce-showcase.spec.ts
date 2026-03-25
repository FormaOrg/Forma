import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcommerceShowcase } from './ecommerce-showcase';

describe('EcommerceShowcase', () => {
  let component: EcommerceShowcase;
  let fixture: ComponentFixture<EcommerceShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceShowcase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcommerceShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

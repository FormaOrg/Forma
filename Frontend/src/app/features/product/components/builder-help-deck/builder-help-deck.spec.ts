import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductHelpDeck } from './builder-help-deck';

describe('ProductHelpDeck', () => {
  let component: ProductHelpDeck;
  let fixture: ComponentFixture<ProductHelpDeck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductHelpDeck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductHelpDeck);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

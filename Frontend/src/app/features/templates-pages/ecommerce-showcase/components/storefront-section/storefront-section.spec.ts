import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorefrontSection } from './storefront-section';

describe('StorefrontSection', () => {
  let component: StorefrontSection;
  let fixture: ComponentFixture<StorefrontSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorefrontSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorefrontSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

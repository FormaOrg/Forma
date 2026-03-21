import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqSupportBanner } from './faq-support-banner';

describe('FaqSupportBanner', () => {
  let component: FaqSupportBanner;
  let fixture: ComponentFixture<FaqSupportBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqSupportBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqSupportBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

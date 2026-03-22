import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyEmailRequiredComponent } from './email-verification-required';

describe('VerifyEmailRequiredComponent', () => {
  let component: VerifyEmailRequiredComponent;
  let fixture: ComponentFixture<VerifyEmailRequiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailRequiredComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailRequiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

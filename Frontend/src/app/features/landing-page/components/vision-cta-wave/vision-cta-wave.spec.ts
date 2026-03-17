import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisionCtaWave } from './vision-cta-wave';

describe('VisionCtaWave', () => {
  let component: VisionCtaWave;
  let fixture: ComponentFixture<VisionCtaWave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisionCtaWave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisionCtaWave);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

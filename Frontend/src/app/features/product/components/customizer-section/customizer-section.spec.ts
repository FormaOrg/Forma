import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizerSection } from './customizer-section';

describe('CustomizerSection', () => {
  let component: CustomizerSection;
  let fixture: ComponentFixture<CustomizerSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizerSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizerSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

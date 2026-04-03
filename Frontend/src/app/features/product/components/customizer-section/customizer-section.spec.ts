import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizerSectionComponent } from './customizer-section';

describe('CustomizerSectionComponent', () => {
  let component: CustomizerSectionComponent;
  let fixture: ComponentFixture<CustomizerSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizerSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizerSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

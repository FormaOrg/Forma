import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfficiencySection } from './efficiency-section';

describe('EfficiencySection', () => {
  let component: EfficiencySection;
  let fixture: ComponentFixture<EfficiencySection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfficiencySection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EfficiencySection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

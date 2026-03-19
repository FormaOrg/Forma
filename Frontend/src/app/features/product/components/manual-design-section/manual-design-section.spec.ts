import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualDesignSection } from './manual-design-section';

describe('ManualDesignSection', () => {
  let component: ManualDesignSection;
  let fixture: ComponentFixture<ManualDesignSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualDesignSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualDesignSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

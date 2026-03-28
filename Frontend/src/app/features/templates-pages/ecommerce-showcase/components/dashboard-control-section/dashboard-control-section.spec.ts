import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardControlSection } from './dashboard-control-section';

describe('DashboardControlSection', () => {
  let component: DashboardControlSection;
  let fixture: ComponentFixture<DashboardControlSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardControlSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardControlSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

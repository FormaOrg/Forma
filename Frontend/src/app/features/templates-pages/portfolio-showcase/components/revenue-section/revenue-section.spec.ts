import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueSection } from './revenue-section';

describe('RevenueSection', () => {
  let component: RevenueSection;
  let fixture: ComponentFixture<RevenueSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

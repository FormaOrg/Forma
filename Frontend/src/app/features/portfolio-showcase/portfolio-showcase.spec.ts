import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioShowcase } from './portfolio-showcase';

describe('PortfolioShowcase', () => {
  let component: PortfolioShowcase;
  let fixture: ComponentFixture<PortfolioShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioShowcase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellEverywhereSection } from './sell-everywhere-section';

describe('SellEverywhereSection', () => {
  let component: SellEverywhereSection;
  let fixture: ComponentFixture<SellEverywhereSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellEverywhereSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellEverywhereSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

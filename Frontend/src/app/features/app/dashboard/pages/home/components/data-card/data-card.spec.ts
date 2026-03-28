import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCard } from './data-card';

describe('DataCard', () => {
  let component: DataCard;
  let fixture: ComponentFixture<DataCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

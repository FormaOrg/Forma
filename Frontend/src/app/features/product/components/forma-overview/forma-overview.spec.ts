import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormaOverview } from './forma-overview';

describe('FormaOverview', () => {
  let component: FormaOverview;
  let fixture: ComponentFixture<FormaOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormaOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormaOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

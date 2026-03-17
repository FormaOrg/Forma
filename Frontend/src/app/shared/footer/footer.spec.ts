import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Foter } from './footer';

describe('Foter', () => {
  let component: Foter;
  let fixture: ComponentFixture<Foter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Foter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Foter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

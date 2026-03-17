import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MadeOnForma } from './made-on-forma';

describe('MadeOnForma', () => {
  let component: MadeOnForma;
  let fixture: ComponentFixture<MadeOnForma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MadeOnForma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MadeOnForma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

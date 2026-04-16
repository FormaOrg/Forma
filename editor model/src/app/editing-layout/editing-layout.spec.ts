import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditingLayout } from './editing-layout';

describe('EditingLayout', () => {
  let component: EditingLayout;
  let fixture: ComponentFixture<EditingLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditingLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditingLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

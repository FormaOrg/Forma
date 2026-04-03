import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormaProcessShowcaseComponent } from './forma-process-showcase';

describe('FormaProcessShowcaseComponent', () => {
  let component: FormaProcessShowcaseComponent;
  let fixture: ComponentFixture<FormaProcessShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormaProcessShowcaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormaProcessShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

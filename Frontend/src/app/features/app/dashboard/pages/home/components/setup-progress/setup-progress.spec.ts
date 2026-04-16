import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupProgress } from './setup-progress';

describe('SetupProgress', () => {
  let component: SetupProgress;
  let fixture: ComponentFixture<SetupProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupProgress);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

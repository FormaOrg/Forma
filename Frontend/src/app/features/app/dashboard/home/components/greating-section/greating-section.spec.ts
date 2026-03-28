import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreatingSection } from './greating-section';

describe('GreatingSection', () => {
  let component: GreatingSection;
  let fixture: ComponentFixture<GreatingSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreatingSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GreatingSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

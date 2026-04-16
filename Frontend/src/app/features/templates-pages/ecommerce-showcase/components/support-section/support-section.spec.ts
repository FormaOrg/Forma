import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportSection } from './support-section';

describe('SupportSection', () => {
  let component: SupportSection;
  let fixture: ComponentFixture<SupportSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

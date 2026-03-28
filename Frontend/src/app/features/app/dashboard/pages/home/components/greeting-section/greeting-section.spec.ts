import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreetingSection } from './greeting-section';

describe('GreetingSection', () => {
  let component: GreetingSection;
  let fixture: ComponentFixture<GreetingSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreetingSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GreetingSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

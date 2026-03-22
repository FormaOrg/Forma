import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainSection } from './domain-section';

describe('DomainSection', () => {
  let component: DomainSection;
  let fixture: ComponentFixture<DomainSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomainSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

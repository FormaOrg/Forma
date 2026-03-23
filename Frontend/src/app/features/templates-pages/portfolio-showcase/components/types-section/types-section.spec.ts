import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypesSection } from './types-section';

describe('TypesSection', () => {
  let component: TypesSection;
  let fixture: ComponentFixture<TypesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypesSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

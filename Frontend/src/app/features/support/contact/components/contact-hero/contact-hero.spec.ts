import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactHero } from './contact-hero';

describe('ContactHero', () => {
  let component: ContactHero;
  let fixture: ComponentFixture<ContactHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactHero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactHero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

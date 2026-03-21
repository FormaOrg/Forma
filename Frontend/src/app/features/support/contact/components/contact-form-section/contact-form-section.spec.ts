import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactFormSection } from './contact-form-section';

describe('ContactFormSection', () => {
  let component: ContactFormSection;
  let fixture: ComponentFixture<ContactFormSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactFormSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactFormSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

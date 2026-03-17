import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderHelpDeck } from './builder-help-deck';

describe('BuilderHelpDeck', () => {
  let component: BuilderHelpDeck;
  let fixture: ComponentFixture<BuilderHelpDeck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderHelpDeck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuilderHelpDeck);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

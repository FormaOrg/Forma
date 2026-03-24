import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogShowcase } from './blog-showcase';

describe('BlogShowcase', () => {
  let component: BlogShowcase;
  let fixture: ComponentFixture<BlogShowcase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogShowcase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

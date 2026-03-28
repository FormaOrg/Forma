import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentTemplates } from './recent-templates';

describe('RecentTemplates', () => {
  let component: RecentTemplates;
  let fixture: ComponentFixture<RecentTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

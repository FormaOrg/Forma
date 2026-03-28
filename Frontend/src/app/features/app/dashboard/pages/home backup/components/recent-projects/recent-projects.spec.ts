import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentProjects } from './recent-projects';

describe('RecentProjects', () => {
  let component: RecentProjects;
  let fixture: ComponentFixture<RecentProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentProjects]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

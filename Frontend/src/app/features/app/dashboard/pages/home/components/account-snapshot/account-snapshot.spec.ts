import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSnapshot } from './account-snapshot';

describe('AccountSnapshot', () => {
  let component: AccountSnapshot;
  let fixture: ComponentFixture<AccountSnapshot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSnapshot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountSnapshot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

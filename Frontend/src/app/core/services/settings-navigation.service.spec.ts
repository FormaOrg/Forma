import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationEnd } from '@angular/router';

import { SettingsNavigationService } from './settings-navigation.service';

describe('SettingsNavigationService', () => {
  let service: SettingsNavigationService;
  let routerEvents: Subject<NavigationEnd>;
  let router: jasmine.SpyObj<Router> & { events: Subject<NavigationEnd>; url: string };

  beforeEach(() => {
    routerEvents = new Subject<NavigationEnd>();
    router = Object.assign(
      jasmine.createSpyObj<Router>('Router', ['navigateByUrl']),
      {
        events: routerEvents,
        url: '/app/home'
      }
    );

    TestBed.configureTestingModule({
      providers: [
        SettingsNavigationService,
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(SettingsNavigationService);
    service.init();
  });

  it('returns the last non-settings route after entering settings', () => {
    routerEvents.next(new NavigationEnd(1, '/app/home', '/app/home'));
    routerEvents.next(new NavigationEnd(2, '/app/projects/35/home?tab=analytics', '/app/projects/35/home?tab=analytics'));
    routerEvents.next(new NavigationEnd(3, '/app/settings/profile', '/app/settings/profile'));

    expect(service.getReturnUrl()).toBe('/app/projects/35/home?tab=analytics');
  });

  it('keeps the original return route while moving inside settings', () => {
    routerEvents.next(new NavigationEnd(1, '/app/projects/35/home', '/app/projects/35/home'));
    routerEvents.next(new NavigationEnd(2, '/app/settings/profile', '/app/settings/profile'));
    routerEvents.next(new NavigationEnd(3, '/app/settings/security', '/app/settings/security'));

    expect(service.getReturnUrl()).toBe('/app/projects/35/home');
  });

  it('falls back to home when settings is opened directly', () => {
    const directAccessRouter = Object.assign(
      jasmine.createSpyObj<Router>('Router', ['navigateByUrl']),
      {
        events: new Subject<NavigationEnd>(),
        url: '/app/settings/profile'
      }
    );
    const directAccessService = new SettingsNavigationService(directAccessRouter);
    directAccessService.init();

    expect(directAccessService.getReturnUrl()).toBe('/app/home');
  });
});

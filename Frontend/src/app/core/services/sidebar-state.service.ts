import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsedSubject.asObservable();

  get isCollapsed(): boolean {
    return this.collapsedSubject.value;
  }

  toggleCollapsed(): void {
    this.collapsedSubject.next(!this.collapsedSubject.value);
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsedSubject.next(collapsed);
  }
}

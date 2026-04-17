import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFoundPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly requestedPath = computed(() => this.route.snapshot.queryParamMap.get('from') || this.router.url || '/');
  readonly isAppPath = computed(() => this.requestedPath().startsWith('/app'));
  readonly primaryLink = computed(() => (this.isAppPath() ? '/app/home' : '/'));
  readonly primaryLabel = computed(() => (this.isAppPath() ? 'Open dashboard' : 'Back home'));

  goBack(): void {
    this.location.back();
  }
}

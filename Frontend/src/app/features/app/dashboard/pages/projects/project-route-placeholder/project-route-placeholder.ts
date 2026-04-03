import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';

import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  PROJECT_SETUP_ITEMS
} from '../../../../../../shared/app/project-setup/project-setup.data';

@Component({
  selector: 'app-project-route-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-route-placeholder.html',
  styleUrl: './project-route-placeholder.css'
})
export class ProjectRoutePlaceholder {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((data) => String(data['title'] ?? 'Project'))),
    { initialValue: String(this.route.snapshot.data['title'] ?? 'Project') }
  );

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
    { initialValue: this.route.parent?.snapshot.paramMap.get('projectId') ?? '' }
  );

  readonly setupItems = PROJECT_SETUP_ITEMS;
  readonly completedSetupItems = getCompletedProjectSetupItems(this.setupItems);
  readonly nextSetupStep = getProjectSetupNextStep(this.setupItems);
  readonly ownerName = 'Ismail';
  readonly projectStatusItems = [
    { label: 'Free plan', accent: false },
    { label: 'Compare plans', accent: true },
    { label: 'No subdomain', accent: false },
    { label: 'Connect subdomain', accent: true },
    { label: 'Edit business info', accent: false }
  ] as const;
  readonly analyticsCards = [
    { label: 'Site sessions', value: '-', helper: 'Available after publish' },
    { label: 'Total sales', value: '-', helper: 'Connected once checkout goes live' }
  ] as const;
  readonly featuredActivity = {
    title: 'Domain connection pending',
    description: 'Finish your custom subdomain setup to start receiving visits on your branded URL.',
    actionLabel: 'Continue setup'
  } as const;
  readonly activityItems = [
    {
      title: 'Homepage draft updated',
      description: 'Your latest layout changes are saved and ready for the next review.',
      timeLabel: 'A few minutes ago',
      actionLabel: 'Open editor'
    },
    {
      title: 'Product catalog ready',
      description: 'Collections and featured products were prepared for your storefront.',
      timeLabel: 'Earlier today',
      actionLabel: 'Review catalog'
    }
  ] as const;
  readonly suggestedItems = [
    {
      title: 'Edit your business info',
      description: 'Add your business name, contact details, and core brand details so the site feels complete.',
      actionLabel: 'Add info'
    },
    {
      title: 'Connect a custom subdomain',
      description: 'Launch with a branded URL that customers can remember and trust.',
      actionLabel: 'Connect'
    }
  ] as const;
}

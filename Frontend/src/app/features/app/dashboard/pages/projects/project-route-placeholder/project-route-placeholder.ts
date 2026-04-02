import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  PROJECT_SETUP_ITEMS
} from '../../../../../../shared/app/project-setup/project-setup.data';

@Component({
  selector: 'app-project-route-placeholder',
  standalone: true,
  imports: [CommonModule],
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
}

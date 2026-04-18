import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { AppIcon } from '../../../../../../../shared/app/icons/app-icon';
import { ProjectService } from '../../../../../../../core/services/project.service';
import {
  CollaboratorRole,
  ProjectCollaborator,
} from '../../../../../../../core/models/project.model';

@Component({
  selector: 'app-storefront-editor-collaborators-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AppIcon],
  templateUrl: './storefront-editor-collaborators-panel.component.html',
  styleUrl: './storefront-editor-collaborators-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontEditorCollaboratorsPanelComponent implements OnInit {
  private readonly projectService = inject(ProjectService);

  readonly projectId = input.required<number>();

  @Output() readonly closed = new EventEmitter<void>();

  readonly collaborators = signal<ProjectCollaborator[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteEmail = signal('');
  readonly inviteRole = signal<CollaboratorRole>('EDITOR');
  readonly isSending = signal(false);
  readonly sendError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCollaborators();
  }

  loadCollaborators(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.projectService.getCollaborators(this.projectId()).subscribe({
      next: (list) => {
        this.collaborators.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('project.storefront.editor.collaborators.loadError');
        this.isLoading.set(false);
      },
    });
  }

  invite(): void {
    const email = this.inviteEmail().trim();
    if (!email) return;
    this.isSending.set(true);
    this.sendError.set(null);
    this.projectService.inviteCollaborator(this.projectId(), { email, role: this.inviteRole() }).subscribe({
      next: (collaborator) => {
        this.collaborators.update((list) => [...list, collaborator]);
        this.inviteEmail.set('');
        this.isSending.set(false);
      },
      error: (err) => {
        const message = err?.error?.message || null;
        this.sendError.set(message);
        this.isSending.set(false);
      },
    });
  }

  remove(collaboratorId: number): void {
    this.projectService.removeCollaborator(this.projectId(), collaboratorId).subscribe({
      next: () => {
        this.collaborators.update((list) => list.filter((c) => c.id !== collaboratorId));
      },
      error: () => {},
    });
  }

  updateRole(collaborator: ProjectCollaborator, role: CollaboratorRole): void {
    this.projectService.updateCollaboratorRole(this.projectId(), collaborator.id, { role }).subscribe({
      next: (updated) => {
        this.collaborators.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c))
        );
      },
      error: () => {},
    });
  }

  collaboratorInitial(c: ProjectCollaborator): string {
    if (c.userName) return c.userName.charAt(0).toUpperCase();
    return c.inviteEmail.charAt(0).toUpperCase();
  }

  collaboratorLabel(c: ProjectCollaborator): string {
    return c.userName || c.inviteEmail;
  }

  close(): void {
    this.closed.emit();
  }
}

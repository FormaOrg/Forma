import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { I18nService } from '../../../../../../landing-page/i18n/i18n.service';
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
  private readonly i18n = inject(I18nService);

  readonly projectId = input.required<number>();

  @Output() readonly closed = new EventEmitter<void>();

  readonly collaborators = signal<ProjectCollaborator[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteEmail = signal('');
  readonly inviteRole = signal<CollaboratorRole>('EDITOR');
  readonly isInviteRoleMenuOpen = signal(false);
  readonly openCollaboratorRoleMenuId = signal<number | null>(null);
  readonly isSending = signal(false);
  readonly sendError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

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
    this.isInviteRoleMenuOpen.set(false);
    this.isSending.set(true);
    this.sendError.set(null);
    this.projectService.inviteCollaborator(this.projectId(), { email, role: this.inviteRole() }).subscribe({
      next: (collaborator) => {
        this.collaborators.update((list) => [...list, collaborator]);
        this.inviteEmail.set('');
        this.isSending.set(false);
      },
      error: (err) => {
        const message = err?.error?.message || 'project.storefront.editor.collaborators.inviteError';
        this.sendError.set(message);
        this.isSending.set(false);
      },
    });
  }

  remove(collaboratorId: number): void {
    this.actionError.set(null);
    this.projectService.removeCollaborator(this.projectId(), collaboratorId).subscribe({
      next: () => {
        this.collaborators.update((list) => list.filter((c) => c.id !== collaboratorId));
      },
      error: () => {
        this.actionError.set('project.storefront.editor.collaborators.removeError');
      },
    });
  }

  updateRole(collaborator: ProjectCollaborator, role: CollaboratorRole): void {
    this.openCollaboratorRoleMenuId.set(null);
    this.actionError.set(null);
    this.projectService.updateCollaboratorRole(this.projectId(), collaborator.id, { role }).subscribe({
      next: (updated) => {
        this.collaborators.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c))
        );
      },
      error: () => {
        this.actionError.set('project.storefront.editor.collaborators.updateRoleError');
      },
    });
  }

  collaboratorInitial(c: ProjectCollaborator): string {
    if (c.userName) return c.userName.charAt(0).toUpperCase();
    return c.inviteEmail.charAt(0).toUpperCase();
  }

  collaboratorLabel(c: ProjectCollaborator): string {
    return c.userName || c.inviteEmail;
  }

  roleLabel(role: CollaboratorRole): string {
    return role === 'EDITOR'
      ? this.i18n.t('project.storefront.editor.collaborators.roleEditor')
      : this.i18n.t('project.storefront.editor.collaborators.roleViewer');
  }

  toggleInviteRoleMenu(): void {
    this.isInviteRoleMenuOpen.update((open) => !open);
    this.openCollaboratorRoleMenuId.set(null);
  }

  selectInviteRole(role: CollaboratorRole): void {
    this.inviteRole.set(role);
    this.isInviteRoleMenuOpen.set(false);
  }

  toggleCollaboratorRoleMenu(collaboratorId: number): void {
    this.openCollaboratorRoleMenuId.update((openId) => openId === collaboratorId ? null : collaboratorId);
    this.isInviteRoleMenuOpen.set(false);
  }

  isCollaboratorRoleMenuOpen(collaboratorId: number): boolean {
    return this.openCollaboratorRoleMenuId() === collaboratorId;
  }

  close(): void {
    this.isInviteRoleMenuOpen.set(false);
    this.openCollaboratorRoleMenuId.set(null);
    this.closed.emit();
  }

  closeMenus(): void {
    this.isInviteRoleMenuOpen.set(false);
    this.openCollaboratorRoleMenuId.set(null);
  }

  stopPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.close();
  }
}

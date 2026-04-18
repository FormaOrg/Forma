import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { ProjectService } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardDataService } from '../../../../core/services/dashboard-data.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  templateUrl: './accept-invitation.html',
  imports: [NgIf, RouterModule]
})
export class AcceptInvitationComponent implements OnInit {
  loading = true;
  success = false;
  message = 'Preparing your invitation...';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly dashboardDataService: DashboardDataService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const returnUrl = this.router.url;

    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'This invitation link is invalid.';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          returnUrl,
          ...(email ? { email } : {})
        }
      });
      return;
    }

    this.projectService.acceptCollaboratorInvitation(token).subscribe({
      next: (collaborator) => {
        this.dashboardDataService.invalidateProjectsOverviewCache();
        this.loading = false;
        this.success = true;
        this.message = 'Invitation accepted. Opening the project...';

        setTimeout(() => {
          void this.router.navigate([`/app/projects/${collaborator.projectId}/home`]);
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.message = err?.error?.message ?? 'We could not accept this invitation.';
      }
    });
  }
}

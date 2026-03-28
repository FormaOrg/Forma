import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type ProjectStatus = 'published' | 'draft';

type RecentProject = {
  name: string;
  domain: string;
  updatedAt: string;
  status: ProjectStatus;
  route: string;
};

@Component({
  selector: 'app-recent-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recent-projects.html',
  styleUrl: './recent-projects.css'
})
export class RecentProjects {
  readonly projects = signal<RecentProject[]>([
    {
      name: 'Portfolio Website',
      domain: 'portfolio.forma.com',
      updatedAt: 'Edited 2 hours ago',
      status: 'published',
      route: '/app/projects/portfolio-website'
    },
    {
      name: 'E-commerce Store',
      domain: 'shop.forma.com',
      updatedAt: 'Edited yesterday',
      status: 'draft',
      route: '/app/projects/ecommerce-store'
    },
    {
      name: 'Landing Page',
      domain: 'landing.forma.com',
      updatedAt: 'Edited 3 days ago',
      status: 'published',
      route: '/app/projects/landing-page'
    },
    {
      name: 'Blog Platform',
      domain: 'blog.forma.com',
      updatedAt: 'Edited last week',
      status: 'draft',
      route: '/app/projects/blog-platform'
    }
  ]);

  trackByName = (_: number, project: RecentProject): string => project.name;
}

import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type RecentTemplateItem = {
  name: string;
  hint: string;
  route: string;
};

@Component({
  selector: 'app-recent-templates',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-templates.html',
  styleUrl: './recent-templates.css'
})
export class RecentTemplates {
  readonly templates = signal<RecentTemplateItem[]>([
    { name: 'Portfolio starter', hint: 'Multi-page', route: '/app/templates' },
    { name: 'Landing minimal', hint: 'Single page', route: '/app/templates' },
    { name: 'Blog editorial', hint: 'Content', route: '/app/templates' }
  ]);

  trackBy = (_: number, t: RecentTemplateItem): string => t.name;
}

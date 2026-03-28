import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type RecentTemplateItem = {
  name: string;
  hint: string;
  image: string;
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
    {
      name: 'Portfolio starter',
      hint: 'Multi-page',
      image: 'assets/Templates Gallery/Mock Templates/9.jpg',
      route: '/app/templates'
    },
    {
      name: 'Landing minimal',
      hint: 'Single page',
      image: 'assets/Templates Gallery/Mock Templates/5.jpg',
      route: '/app/templates'
    },
    {
      name: 'Blog editorial',
      hint: 'Content',
      image: 'assets/Templates Gallery/Mock Templates/11.jpg',
      route: '/app/templates'
    }
  ]);

  trackBy = (_: number, t: RecentTemplateItem): string => t.name;
}
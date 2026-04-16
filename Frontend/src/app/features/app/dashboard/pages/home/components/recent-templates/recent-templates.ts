import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { HomeRecentTemplateItem } from '../../home.model';

@Component({
  selector: 'app-recent-templates',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './recent-templates.html',
  styleUrl: './recent-templates.css'
})
export class RecentTemplates {
  @Input() templates: HomeRecentTemplateItem[] = [];

  trackBy = (_: number, t: HomeRecentTemplateItem): string => t.name;
}

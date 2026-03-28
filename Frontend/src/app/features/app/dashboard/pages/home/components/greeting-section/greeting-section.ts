import { Component, Input } from '@angular/core';
import { LinkButton } from '../../../../../../../shared/components/link-button/link-button';

@Component({
  selector: 'app-greeting-section',
  imports: [LinkButton],
  templateUrl: './greeting-section.html',
  styleUrl: './greeting-section.css',
})
export class GreetingSection {
  @Input() userName = 'Ismail';
}

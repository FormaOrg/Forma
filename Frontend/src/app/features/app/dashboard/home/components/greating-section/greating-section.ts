import { Component, Input } from '@angular/core';
import { LinkButton } from "../../../../../../shared/components/link-button/link-button";

@Component({
  selector: 'app-greating-section',
  imports: [LinkButton],
  templateUrl: './greating-section.html',
  styleUrl: './greating-section.css',
})
export class GreatingSection {
  @Input() userName = 'Ismail';
}

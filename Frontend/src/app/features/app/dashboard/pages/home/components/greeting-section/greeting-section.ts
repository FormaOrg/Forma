import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-greeting-section',
  imports: [RouterLink],
  templateUrl: './greeting-section.html',
  styleUrl: './greeting-section.css',
})
export class GreetingSection {
  @Input() userName = 'Ismail';
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting-section',
  standalone: true,
  imports: [],
  templateUrl: './greeting-section.html',
  styleUrl: './greeting-section.css'
})
export class GreetingSection {
  @Input() userName = 'Ismail';
}

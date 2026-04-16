import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'link-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './link-button.html',
  styleUrls: ['./link-button.css'],
})
export class LinkButton {
  @Input() bgColor!: string;
  @Input() txtColor!: string;
  @Input() theme!: string;  
  @Input() content!: string;
  @Input() width: string = "180px";
  @Input() height: string = "55px";
  @Input() fontSize: string = "1.2em";
  @Input() fontWeight: string = "5000";
  @Input() padding: string = "10px 30px";
  @Input() txtSlide: string = "-12px";
  @Input() arrowSlide: string = "-7px";
  @Input() border: string = "none";
  @Input() arrowFilter: string = "none";
  @Input() routerLink?: string | any[];
}

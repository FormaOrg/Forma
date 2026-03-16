import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}

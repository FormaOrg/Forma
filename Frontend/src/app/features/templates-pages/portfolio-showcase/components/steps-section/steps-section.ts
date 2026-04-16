import { Component, signal } from '@angular/core';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type StepItem = {
  number: string;
  strong: string;
  rest: string;
};


@Component({
  selector: 'app-steps-section',
  imports: [LinkButton],
  templateUrl: './steps-section.html',
  styleUrl: './steps-section.css',
})
export class StepsSection {
  readonly steps = signal<StepItem[]>([
    {
      number: '01',
      strong: 'Choose a starting point.',
      rest: 'Find a template you love, or start with AI to create your digital portfolio. Forma offers free portfolio templates you can customize and make your own. ',
    },
    {
      number: '02',
      strong: 'Add your work.',
      rest: 'Use the portfolio builder to upload images and videos. Arrange them into organized projects to make your website more personal and engaging.',
    },
    {
      number: '03',
      strong: 'Customize anything.',
      rest: 'Make your portfolio site look just the way you imagined—no code needed. Easily adjust colors, fonts and layouts to reflect your unique brand.',
    },
    {
      number: '04',
      strong: 'Publish your site.',
      rest: 'Once everything looks perfect, pick a domain name, connect it and go live with a click. Share your portfolio website and keep updating it as you go.',
    },
    {
      number: '05',
      strong: 'Promote your online portfolio.',
      rest: 'Get your website noticed using built-in marketing tools. Send email campaigns and track analytics to grow and expand your reach.',
    },
  ]);
}

import { Component, signal } from '@angular/core';

type StepItem = {
  number: string;
  strong: string;
  rest: string;
};

@Component({
  selector: 'app-steps-section2',
  imports: [],
  templateUrl: './steps-section.html',
  styleUrl: './steps-section.css',
})
export class StepsSection2 {
  readonly steps = signal<StepItem[]>([
    {
      number: '01',
      strong: 'Map out your goals.',
      rest: 'Nail down your site’s purpose, who it’s for and what you want to achieve.',
    },
    {
      number: '02',
      strong: '​Start designing.',
      rest: 'Explore 2000+ free templates or let the AI website builder craft it for you.',
    },
    {
      number: '03',
      strong: 'Customize your website.',
      rest: 'Easily tailor your site to your brand with the drag and drop editor.',
    },
    {
      number: '04',
      strong: 'Add visual effects.',
      rest: 'Make your site memorable with easy-to-use design features.',
    },
    {
      number: '05',
      strong: 'Publish your website. ',
      rest: 'Claim your custom domain name, connect it and go live.',
    },
  ]);
}
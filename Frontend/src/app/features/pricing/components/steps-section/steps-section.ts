import { Component, signal } from '@angular/core';

type StepItem = {
  number: string;
  strong: string;
  rest: string;
};

@Component({
  selector: 'app-steps-section',
  imports: [],
  templateUrl: './steps-section.html',
  styleUrl: './steps-section.css',
})
export class StepsSection {
  readonly steps = signal<StepItem[]>([
    {
      number: '01',
      strong: 'Choose a free template',
      rest: 'or use the AI website builder to create a unique site that’s ready for business.',
    },
    {
      number: '02',
      strong: 'Customize everything',
      rest: 'from the site layout to visuals and content, using the drag-and-drop editor.',
    },
    {
      number: '03',
      strong: 'Add business offerings',
      rest: 'like eCommerce, scheduling solutions, a blog and more.',
    },
    {
      number: '04',
      strong: 'Find and register the perfect domain',
      rest: 'or connect a domain name you already own.',
    },
    {
      number: '05',
      strong: 'Start getting traffic',
      rest: 'and expand your reach with built-in marketing and SEO tools.',
    },
  ]);
}
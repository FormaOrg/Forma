import { Component, signal } from '@angular/core';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type StepItem = {
  number: string;
  strong: string;
  rest: string;
};


@Component({
  selector: 'app-blog-steps-section',
  imports: [LinkButton],
  templateUrl: './steps-section.html',
  styleUrl: './steps-section.css',
})
export class StepsSection {
  readonly steps = signal<StepItem[]>([
    {
      number: '01',
      strong: 'Sign up for free.',
      rest: 'Create your Forma account and choose what kind of blog you want to build.',
    },
    {
      number: '02',
      strong: 'Pick a blog template.',
      rest: 'Browse 900+ free customizable blog templates and choose one that fits your style.',
    },
    {
      number: '03',
      strong: 'Make it yours.',
      rest: 'Customize layouts, fonts, colors, and sections with the drag-and-drop editor — no code needed.',
    },
    {
      number: '04',
      strong: 'Write and publish your first post.',
      rest: 'Use the built-in editor to craft your content, add images, and hit publish when you\'re ready.',
    },
    {
      number: '05',
      strong: 'Grow your audience.',
      rest: 'Share your blog on social media, optimize for search engines, and connect with your readers.',
    },
  ]);
}
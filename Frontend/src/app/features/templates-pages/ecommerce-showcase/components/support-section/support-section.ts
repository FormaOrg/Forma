import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type SupportItem = {
  title: string;
  description: string;
  linkLabel: string;
  linkHref: string;
};

@Component({
  selector: 'app-ecommerce-support-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-section.html',
  styleUrl: './support-section.css',
})
export class SupportSection {
  readonly items: SupportItem[] = [
    {
      title: 'Find quick solutions',
      description:
        'Get answers from tutorials and practical step-by-step guides in the Forma Tutorials Library.',
      linkLabel: 'Go to Tutorials',
      linkHref: '/tutorials',
    },
    {
      title: 'Contact us',
      description:
        'Get round-the-clock dedicated support by chat or schedule a call with Customer Care.',
      linkLabel: 'Log In & Chat With Us',
      linkHref: '/contact',
    },
    {
      title: 'Hire a pro',
      description:
        'Get a pro to do it for you-from site creation to eCommerce growth.',
      linkLabel: 'Browse All Services',
      linkHref: '/services',
    },
  ];
}
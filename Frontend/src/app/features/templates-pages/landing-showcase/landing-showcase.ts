import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Footer } from '../../../shared/footer/footer';
import { Header } from '../../../shared/header/header';

@Component({
  selector: 'app-landing-showcase',
  imports: [
    CommonModule,
    Header,
    RouterLink,
    Footer,
  ],
  templateUrl: './landing-showcase.html',
})
export class LandingShowcase {
  readonly jumpLinks = [
    { label: 'Hero', href: '#hero' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'Proof', href: '#proof' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'CTA', href: '#cta' },
  ];

  readonly heroStats = [
    { value: '3 blocks', label: 'to launch a focused page' },
    { value: '1 day', label: 'to ship a polished draft' },
    { value: '+28%', label: 'clearer conversion path' },
  ];

  readonly heroPills = ['Focused CTA', 'Fast mobile layout', 'Clean proof blocks'];

  readonly benefits = [
    {
      title: 'Clear first impression',
      body: 'Lead with one promise, one audience, and one action instead of sending visitors through a full website maze.',
    },
    {
      title: 'Built for campaigns',
      body: 'Perfect for launches, waitlists, product drops, and lead magnets where speed matters more than extra pages.',
    },
    {
      title: 'Easy to personalize',
      body: 'Swap proof, copy, and visual tone quickly without reworking a large site structure.',
    },
  ];

  readonly proofLogos = ['Northnote', 'Studio Frame', 'Beacon Labs', 'Aster', 'Plainstack'];

  readonly testimonials = [
    {
      quote: 'We replaced a cluttered microsite with one focused landing page and immediately got cleaner demo requests.',
      author: 'Mina K.',
      role: 'Growth lead at Northnote',
    },
    {
      quote: 'The structure made our offer obvious. Visitors understood the value before they even scrolled halfway.',
      author: 'Rami T.',
      role: 'Founder at Plainstack',
    },
  ];

  readonly proofMetrics = [
    { value: '250+', label: 'teams using focused campaign pages' },
    { value: '4.9/5', label: 'average template satisfaction' },
    { value: '18 min', label: 'to adapt copy and CTA blocks' },
  ];

  readonly featureBlocks = [
    {
      eyebrow: 'Messaging',
      title: 'Hero sections that make the offer obvious',
      body: 'Use a sharp headline, a short supporting sentence, and one clear primary action to keep attention where it matters.',
      bullets: ['Above-the-fold CTA', 'Compact trust strip', 'Fast mobile readability'],
    },
    {
      eyebrow: 'Conversion',
      title: 'Feature and proof blocks that answer objections',
      body: 'Stack benefits, outcomes, and lightweight social proof in a sequence that feels persuasive without being noisy.',
      bullets: ['Benefit-first layout', 'Testimonials and logos', 'Simple comparison callouts'],
    },
    {
      eyebrow: 'Offer',
      title: 'A simple pricing section that closes the loop',
      body: 'Finish with one offer, a concise guarantee, and a CTA that matches the promise from the hero.',
      bullets: ['Single plan focus', 'Short feature list', 'Low-friction closing section'],
    },
  ];

  readonly pricingItems = [
    'One conversion-focused landing page',
    'Reusable sections for launches and waitlists',
    'Fast edits for copy, visuals, and CTA variants',
    'Mobile-ready structure out of the box',
  ];
}

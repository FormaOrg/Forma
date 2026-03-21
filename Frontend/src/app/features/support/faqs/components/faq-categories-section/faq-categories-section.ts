import { Component, signal } from '@angular/core';

interface FaqCategory {
  title: string;
  description: string;
  articles: number;
  icon: string;
}

@Component({
  selector: 'app-faq-categories-section',
  standalone: true,
  templateUrl: './faq-categories-section.html',
  styleUrls: ['./faq-categories-section.css']
})
export class FaqCategoriesSection {
  readonly categories = signal<FaqCategory[]>([
    {
      title: 'Getting Started',
      description: 'Learn the basics, set things up, and get moving quickly.',
      articles: 12,
      icon: '◧'
    },
    {
      title: 'Managing Your Site',
      description: 'Update content, organize pages, and keep everything running smoothly.',
      articles: 18,
      icon: '⌘'
    },
    {
      title: 'Billing & Payments',
      description: 'Understand plans, invoices, payment methods, and subscriptions.',
      articles: 9,
      icon: '◌'
    },
    {
      title: 'Domains',
      description: 'Connect, transfer, manage, and troubleshoot your domains.',
      articles: 11,
      icon: '◎'
    },
    {
      title: 'eCommerce',
      description: 'Manage products, orders, payments, and your online store setup.',
      articles: 16,
      icon: '▣'
    },
    {
      title: 'Bookings',
      description: 'Set availability, manage services, and streamline appointments.',
      articles: 10,
      icon: '◐'
    },
    {
      title: 'Marketing & SEO',
      description: 'Improve visibility, traffic, search performance, and campaigns.',
      articles: 14,
      icon: '↗'
    },
    {
      title: 'Account & Login',
      description: 'Access account settings, permissions, security, and login help.',
      articles: 8,
      icon: '◍'
    },
    {
      title: 'Technical Issues',
      description: 'Fix common problems, errors, performance issues, and bugs.',
      articles: 13,
      icon: '✦'
    }
  ]);
}
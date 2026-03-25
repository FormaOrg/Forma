import { Component, signal } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-popular-questions',
  standalone: true,
  templateUrl: './popular-questions.html',
  styleUrls: ['./popular-questions.css']
})
export class PopularQuestions {
  readonly faqs = signal<FaqItem[]>([
    {
      question: 'How do I connect my domain to my website?',
      answer:
        'Go to your domain settings, choose connect existing domain, then follow the DNS steps provided in your dashboard.'
    },
    {
      question: 'How can I manage my billing and invoices?',
      answer:
        'Open your billing area to view plans, payment methods, invoices and subscription details in one place.'
    },
    {
      question: 'Why is my website not showing the latest changes?',
      answer:
        'Usually the site needs to be published again, or your browser cache needs to be refreshed after recent edits.'
    },
    {
      question: 'How do I set up online bookings?',
      answer:
        'Add the bookings feature, create your services, define availability and publish your booking page.'
    },
    {
      question: 'Can I recover deleted content?',
      answer:
        'Some deleted content can be restored through site history or backups depending on the feature and your plan.'
    },
    {
      question: 'How do I contact support directly?',
      answer:
        'You can start a live chat, submit a ticket or browse guided support resources from your help center.'
    },
    {
      question: 'How do I improve my site SEO?',
      answer:
        'Start with titles, meta descriptions, page structure, mobile performance and keyword-focused content.'
    },
    {
      question: 'How do I reset my account password?',
      answer:
        'Use the forgot password option on the login page and follow the reset link sent to your email.'
    }
  ]);

  readonly openIndex = signal<number | null>(0);

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }

  toggleItem(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  QueryList,
  ViewChildren,
  ElementRef,
  signal
} from '@angular/core';

interface FaqQuestion {
  question: string;
  answer: string;
}

interface FaqGroup {
  id: string;
  title: string;
  intro: string;
  colorClass: string;
  questions: FaqQuestion[];
}

// Map from colorClass → card background hex used by CSS custom property
const COLOR_MAP: Record<string, string> = {
  'group-card--green':  '#81b29a',
  'group-card--yellow': '#f0c808',
  'group-card--blue':   '#8ecae6',
  'group-card--purple': '#9d4edd'
};

@Component({
  selector: 'app-faq-details-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-details-section.html',
})
export class FaqDetailsSection implements AfterViewInit {
  @ViewChildren('faqSection') faqSections!: QueryList<ElementRef<HTMLElement>>;

  readonly groups = signal<FaqGroup[]>([
    {
      id: 'getting-started',
      title: 'Getting Started',
      intro: 'Start here if you are setting things up for the first time and want the fastest path forward.',
      colorClass: 'group-card--green',
      questions: [
        {
          question: 'How do I create my first website?',
          answer: 'Start by choosing a template or blank canvas, then customize your pages, add your content, and publish when you are ready.'
        },
        {
          question: 'Can I edit my site before publishing it?',
          answer: 'Yes. You can build and preview your website privately before publishing any changes live.'
        },
        {
          question: 'Where do I find my dashboard settings?',
          answer: 'Open your main dashboard and use the settings area to manage site details, permissions, billing, and connected features.'
        }
      ]
    },
    {
      id: 'billing-payments',
      title: 'Billing & Payments',
      intro: 'Manage subscriptions, invoices, payment methods, and renewal details in one place.',
      colorClass: 'group-card--yellow',
      questions: [
        {
          question: 'Where can I see my invoices?',
          answer: 'You can find invoices in the billing section of your account, alongside your plan details and payment history.'
        },
        {
          question: 'How do I update my payment method?',
          answer: 'Go to billing settings, choose your active subscription, and update your saved payment details.'
        },
        {
          question: 'Can I cancel or change my plan?',
          answer: 'Yes. You can switch plans or cancel renewal settings from your subscription management area.'
        }
      ]
    },
    {
      id: 'domains',
      title: 'Domains',
      intro: 'Connect, transfer, verify, and troubleshoot your domain setup without losing track of DNS steps.',
      colorClass: 'group-card--blue',
      questions: [
        {
          question: 'How do I connect an existing domain?',
          answer: 'Choose connect existing domain, then update the required DNS records with your domain provider.'
        },
        {
          question: 'Why is my domain not connecting?',
          answer: 'Usually DNS propagation is still in progress, or one of the required records has not been entered correctly.'
        },
        {
          question: 'How long does domain connection take?',
          answer: 'Most connections complete within a few hours, though DNS changes can sometimes take up to 48 hours.'
        }
      ]
    },
    {
      id: 'technical-issues',
      title: 'Technical Issues',
      intro: 'Use this section for performance issues, publishing problems, login problems, and unexpected errors.',
      colorClass: 'group-card--purple',
      questions: [
        {
          question: 'Why are my latest changes not visible?',
          answer: 'Make sure you republished the site and clear your browser cache if older content is still being shown.'
        },
        {
          question: 'What should I do if something looks broken?',
          answer: 'Test the issue in another browser, review recent edits, and disable conflicting elements one by one.'
        },
        {
          question: 'How do I report a bug?',
          answer: 'Use the support form or live chat and include screenshots, steps to reproduce, and your browser details.'
        }
      ]
    }
  ]);

  // ── Accordion state (single open item per group, matching your original) ──

  readonly openItems = signal<Record<string, number | null>>({
    'getting-started':   0,
    'billing-payments':  null,
    'domains':           null,
    'technical-issues':  null
  });

  // ── Deck state ────────────────────────────────────────

  /** Index of the card currently shown at the front of the deck */
  readonly activeIndex = signal<number>(0);

  /**
   * Kept for template compatibility — mirrors activeIndex as a group id
   * in case any other part of the template still references activeSection.
   */
  readonly activeSection = signal<string>('getting-started');

  // ── Lifecycle ─────────────────────────────────────────

  ngAfterViewInit(): void {
    // IntersectionObserver is no longer used for navigation (nav is click-driven),
    // but we keep it so activeSection stays in sync if you need it elsewhere.
    this.observeSections();
  }

  // ── Deck helpers ──────────────────────────────────────

  /**
   * Returns the resolved card background colour for a given colorClass.
   * Used by the template to set --card-color on each deck card.
   */
  getCardColor(colorClass: string): string {
    return COLOR_MAP[colorClass] ?? '#ffffff';
  }

  /**
   * Returns the position class for card at `cardIndex` relative to activeIndex.
   *
   *   distance 0 → faq-card--front
   *   distance 1 → faq-card--back-1  (peeks 68 px)
   *   distance 2 → faq-card--back-2  (peeks 46 px)
   *   distance 3 → faq-card--back-3  (peeks 28 px)
   *   distance 4+ → faq-card--hidden
   *
   * Cards wrap — ones before activeIndex appear at the bottom of the deck.
   */
  getDeckClass(cardIndex: number): string {
    const total = this.groups().length;
    const active = this.activeIndex();
    const distance = (cardIndex - active + total) % total;

    switch (distance) {
      case 0:  return 'faq-card faq-card--front';
      case 1:  return 'faq-card faq-card--back-1';
      case 2:  return 'faq-card faq-card--back-2';
      case 3:  return 'faq-card faq-card--back-3';
      default: return 'faq-card faq-card--hidden';
    }
  }

  /** Called by sidebar nav button clicks */
  selectCard(index: number): void {
    const group = this.groups()[index];
    this.activeIndex.set(index);
    this.activeSection.set(group.id);
  }

  // ── Accordion helpers ─────────────────────────────────

  toggleItem(groupId: string, index: number): void {
    this.openItems.update((state) => ({
      ...state,
      [groupId]: state[groupId] === index ? null : index
    }));
  }

  isOpen(groupId: string, index: number): boolean {
    return this.openItems()[groupId] === index;
  }

  // ── Kept for compatibility — scrollToSection is now a no-op ──────────────

  scrollToSection(_id: string): void {
    // Navigation is handled by selectCard(); this method is preserved
    // in case it is referenced elsewhere in your codebase.
  }

  // ── IntersectionObserver (passive — keeps activeSection in sync) ──────────

  private observeSections(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          const id = visible[0].target.id;
          const idx = this.groups().findIndex((g) => g.id === id);
          if (idx !== -1) {
            // Only sync when the user scrolls independently (not via selectCard)
            this.activeSection.set(id);
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0.15, 0.3, 0.5, 0.75]
      }
    );

    this.faqSections.forEach((s) => observer.observe(s.nativeElement));
  }
}
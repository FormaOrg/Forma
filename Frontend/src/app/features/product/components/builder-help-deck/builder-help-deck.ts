import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type FaqItem = {
    question: string;
    answer: string;
};

@Component({
    selector: 'app-product-help-deck',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './builder-help-deck.html',
    styleUrl: './builder-help-deck.css'
})
export class ProductHelpDeck {
    readonly faqs = signal<FaqItem[]>([
        {
            question: 'What can I build with this platform?',
            answer: 'You can create full websites, landing pages, and reusable sections using a visual builder. Combine layouts, animations, and components to design anything from simple pages to complex product experiences without starting from scratch.'
        },
        {
            question: 'Do I need coding skills to use it?',
            answer: 'No coding is required. The builder is fully visual, allowing you to drag, edit, and customize everything directly. Advanced users can still integrate custom code when needed for more control.'
        },
        {
            question: 'Can I customize animations and scroll effects?',
            answer: 'Yes. You can add smooth animations, parallax effects, and scroll-based interactions directly inside the editor. Each element can have its own motion behavior, timing, and responsiveness.'
        },
        {
            question: 'Is everything responsive by default?',
            answer: 'All sections are designed to be responsive out of the box. You can also fine-tune layouts, spacing, and visibility for different screen sizes to ensure your design looks perfect on mobile, tablet, and desktop.'
        },
        {
            question: 'Can I reuse sections across multiple pages?',
            answer: 'Yes. You can save and reuse sections as templates across your project. This helps you build faster, maintain consistency, and scale your design system efficiently.'
        },
        {
            question: 'How does publishing work?',
            answer: 'Once your page is ready, you can publish it instantly. Changes are reflected in real time, and you can continue updating your content without downtime.'
        }
    ]);

    readonly openIndex = signal<number>(0);

    toggleItem(index: number): void {
        this.openIndex.set(this.openIndex() === index ? -1 : index);
    }

    isOpen(index: number): boolean {
        return this.openIndex() === index;
    }
}
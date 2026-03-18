import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type FaqItem = {
    question: string;
    answer: string;
};

@Component({
    selector: 'app-pricing-help-deck',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './builder-help-deck.html',
    styleUrl: './builder-help-deck.css'
})
export class BuilderHelpDeck {
    readonly faqs = signal<FaqItem[]>([
        {
            question: 'Can I change my plan later?',
            answer: 'Yes. You can upgrade or downgrade your plan at any time, and changes will be applied immediately.'
        },
        {
            question: 'Is there a free trial available?',
            answer: 'Yes. You can start for free and explore Forma before committing to a paid plan.'
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept major credit cards and other secure payment methods depending on your region.'
        },
        {
            question: 'Do you offer refunds?',
            answer: 'Yes. If you’re not satisfied, you can request a refund within the eligible period after your purchase.'
        },
        {
            question: 'What happens if I cancel my subscription?',
            answer: 'You will retain access to your plan features until the end of your billing cycle, after which your account will switch to the free plan.'
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
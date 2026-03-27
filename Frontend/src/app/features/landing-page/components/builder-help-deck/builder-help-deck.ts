import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

type FaqItem = {
    question: string;
    answer: string;
};

@Component({
    selector: 'app-landing-page-builder-help-deck',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './builder-help-deck.html',
    styleUrl: './builder-help-deck.css'
})
export class BuilderHelpDeck {
    readonly faqs = signal<FaqItem[]>([
        {
            question: 'landing.builderHelpDeck.items.easy.question',
            answer: 'landing.builderHelpDeck.items.easy.answer'
        },
        {
            question: 'landing.builderHelpDeck.items.customize.question',
            answer: 'landing.builderHelpDeck.items.customize.answer'
        },
        {
            question: 'landing.builderHelpDeck.items.responsive.question',
            answer: 'landing.builderHelpDeck.items.responsive.answer'
        },
        {
            question: 'landing.builderHelpDeck.items.publish.question',
            answer: 'landing.builderHelpDeck.items.publish.answer'
        },
        {
            question: 'landing.builderHelpDeck.items.ai.question',
            answer: 'landing.builderHelpDeck.items.ai.answer'
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
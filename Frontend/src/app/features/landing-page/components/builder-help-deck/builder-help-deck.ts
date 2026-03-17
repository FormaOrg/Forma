import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

type FaqItem = {
    question: string;
    answer: string;
};

@Component({
    selector: 'app-builder-help-deck',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './builder-help-deck.html',
    styleUrl: './builder-help-deck.css'
})
export class BuilderHelpDeck {
    readonly faqs = signal<FaqItem[]>([
        {
            question: 'Is it easy to build a website',
            answer: 'No. Forma is built for everyone — from beginners to professionals — with an intuitive drag-and-drop interface.'
        },
        {
            question: 'Can I customize templates completely?',
            answer: 'Yes. You can fully customize layouts, fonts, colors, images, sections, and content to match your brand and style.'
        },
        {
            question: 'Are the websites built with Forma responsive?',
            answer: 'Yes. Every website is designed to adapt smoothly across desktop, tablet, and mobile devices.'
        },
        {
            question: 'Can I publish my website instantly?',
            answer: 'Yes. Once your content is ready, you can publish your website in just a few clicks.'
        },
        {
            question: 'Does Forma offer AI features?',
            answer: 'Yes. Forma can help speed up content creation, design suggestions, and workflow automation with AI-powered tools.'
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
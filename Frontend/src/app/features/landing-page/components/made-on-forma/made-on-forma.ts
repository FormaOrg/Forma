import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";
import { TranslatePipe } from '../../i18n/translate.pipe';

type ShowcaseItem = {
    image: string;
    altKey: string;
};

@Component({
    selector: 'app-landing-page-made-on-forma',
    standalone: true,
    imports: [CommonModule, LinkButton, TranslatePipe],
    templateUrl: './made-on-forma.html',
    styleUrl: './made-on-forma.css'
})
export class MadeOnForma {
    private readonly scrollY = signal(0);

    readonly topRow = signal<ShowcaseItem[]>([
        { image: 'assets/Landing Page/templates/11.jpg', altKey: 'landing.madeOnForma.alt.1' },
        { image: 'assets/Landing Page/templates/12.jpg', altKey: 'landing.madeOnForma.alt.2' },
        { image: 'assets/Landing Page/templates/13.png', altKey: 'landing.madeOnForma.alt.3' },
        { image: 'assets/Landing Page/templates/14.png', altKey: 'landing.madeOnForma.alt.4' }
    ]);

    readonly bottomRow = signal<ShowcaseItem[]>([
        { image: 'assets/Landing Page/templates/21.jpg', altKey: 'landing.madeOnForma.alt.5' },
        { image: 'assets/Landing Page/templates/22.jpg', altKey: 'landing.madeOnForma.alt.6' },
        { image: 'assets/Landing Page/templates/23.jpg', altKey: 'landing.madeOnForma.alt.7' },
        { image: 'assets/Landing Page/templates/24.png', altKey: 'landing.madeOnForma.alt.8' }
    ]);

    readonly topTransform = computed(() => {
        const scrollOffset = this.scrollY() * 0.12;
        const initialOffset = 500;

        return `translate3d(${initialOffset - scrollOffset}px, 0, 0)`;
    });

    readonly bottomTransform = computed(() => {
        const scrollOffset = this.scrollY() * 0.12;
        const initialOffset = -800;

        return `translate3d(${initialOffset + scrollOffset}px, 0, 0)`;
    });

    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.scrollY.set(window.scrollY || 0);
    }
}
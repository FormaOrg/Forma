import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";

type ShowcaseItem = {
    image: string;
    alt: string;
};

@Component({
    selector: 'app-landing-page-made-on-forma',
    standalone: true,
    imports: [CommonModule, LinkButton],
    templateUrl: './made-on-forma.html',
    styleUrl: './made-on-forma.css'
})
export class MadeOnForma {
    private readonly scrollY = signal(0);

    readonly topRow = signal<ShowcaseItem[]>([
        { image: 'assets/Landing Page/templates/11.jpg', alt: 'Website preview 1' },
        { image: 'assets/Landing Page/templates/12.jpg', alt: 'Website preview 2' },
        { image: 'assets/Landing Page/templates/13.png', alt: 'Website preview 3' },
        { image: 'assets/Landing Page/templates/14.png', alt: 'Website preview 4' }
    ]);

    readonly bottomRow = signal<ShowcaseItem[]>([
        { image: 'assets/Landing Page/templates/21.jpg', alt: 'Website preview 5' },
        { image: 'assets/Landing Page/templates/22.jpg', alt: 'Website preview 6' },
        { image: 'assets/Landing Page/templates/23.jpg', alt: 'Website preview 7' },
        { image: 'assets/Landing Page/templates/24.png', alt: 'Website preview 8' }
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
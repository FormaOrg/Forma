import { Component } from '@angular/core';

@Component({
  selector: 'faq-section',
  imports: [],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.css',
})
export class FaqSection {
  toggle(event: Event) {
    const header = event.currentTarget as HTMLElement;
    const clickedItem = header.closest('.accordion-item') as HTMLElement;
    const currentActive = document.querySelector('.accordion-item.active') as HTMLElement;

    if (currentActive && currentActive !== clickedItem) {
        currentActive.querySelector('.chevron')!.classList.remove('rotated');
        currentActive.classList.remove('active');
    }

    if (clickedItem !== currentActive) {
        clickedItem.classList.add('active');
        clickedItem.querySelector('.chevron')!.classList.add('rotated');
    }
  }
}

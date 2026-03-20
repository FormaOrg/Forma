import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

@Component({
  selector: 'app-tutorials-main-section',
  imports: [
    CommonModule,
    LinkButton
  ],
  templateUrl: './tutorials-main-section.html',
  styleUrl: './tutorials-main-section.css',
})
export class TutorialsMainSection {
  mouseX = 50;
  mouseY = 50;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    this.mouseX = ((event.clientX - rect.left) / rect.width) * 100;
    this.mouseY = ((event.clientY - rect.top) / rect.height) * 100;
  }
}

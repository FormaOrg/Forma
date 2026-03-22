import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Step = {
  bgColor: string;
  image: string;
  alt: string;
};

@Component({
  selector: 'app-steps-display-section',
  imports: [CommonModule],
  templateUrl: './steps-display-section.html',
  styleUrl: './steps-display-section.css',
})
export class StepsDisplaySection {

  activeIndex = 0;

  readonly steps: Step[] = [
    {
      bgColor: '#e8e4ff',  // soft purple
      image: 'assets/Portfolio Website Gallery/Steps/1.png',
      alt: 'Pick a template preview',
    },
    {
      bgColor: '#8B3A2A',  // terracotta
      image: 'assets/Portfolio Website Gallery/Steps/2.png',
      alt: 'Choose your layout preview',
    },
    {
      bgColor: '#F5E642',  // yellow
      image: 'assets/Portfolio Website Gallery/Steps/3.png',
      alt: 'Customize everything preview',
    },
    {
      bgColor: '#B8D8E8',  // light blue
      image: 'assets/Portfolio Website Gallery/Steps/4.png',
      alt: 'Run it all from one place preview',
    },
  ];

  get activeStep(): Step {
    return this.steps[this.activeIndex];
  }

  setActive(index: number): void {
    if (index !== this.activeIndex) {
      this.activeIndex = index;
    }
  }
}
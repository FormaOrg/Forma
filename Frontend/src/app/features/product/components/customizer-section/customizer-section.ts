import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ThemeOption {
  name: string;
  description: string;
  brand: string;
  headline: string;
  tag: string;
  dot: string;
  heroBg: string;
  heroTop: string;
  surfaceCard: string;
  surfaceSoft: string;
  surfaceLine: string;
  text: string;
  ink: string;
  pillBg: string;
  image: string;
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
}

@Component({
  selector: 'app-customizer-section',
  imports: [CommonModule],
  templateUrl: './customizer-section.html',
  styleUrls: ['./customizer-section.css']
})
export class CustomizerSectionComponent {
  activeTheme = 0;
  animatePreview = false;

  themes: ThemeOption[] = [
    {
      name: 'Fresh',
      description: 'A clean, grounded palette with soft contrast and a natural feel.',
      brand: 'Konrail.',
      headline: 'Forward-thinking design. Responsible craftsmanship.',
      tag: 'Nylon square bag in dual colors ↗',
      dot: '#17910f',
      heroBg: '#047000',
      heroTop: '#98d182',
      surfaceCard: '#f6f3ea',
      surfaceSoft: 'rgba(255,255,255,0.14)',
      surfaceLine: 'rgba(255,255,255,0.2)',
      text: '#f7f7f2',
      ink: '#1f314b',
      pillBg: '#f2efe2',
      image: 'assets/images/green.avif',
      buttonBg: '#047000',
      buttonText: '#ffffff',
      buttonHover: '#0b8607'

    },
    {
      name: 'Ocean',
      description: 'Cool, airy tones with a more editorial and contemporary mood.',
      brand: 'Velora.',
      headline: 'Thoughtful objects shaped by clarity, function, and movement.',
      tag: 'Coastal utility collection ↗',
      dot: '#367ea8',
      heroBg: '#0f4f74',
      heroTop: '#9fd3df',
      surfaceCard: '#f4fbff',
      surfaceSoft: 'rgba(255,255,255,0.14)',
      surfaceLine: 'rgba(255,255,255,0.22)',
      text: '#f3fbff',
      ink: '#1f3d53',
      pillBg: '#eef7fa',
      image: 'assets/images/blue.jpg',
      buttonBg: '#0f4f74',
      buttonText: '#ffffff',
      buttonHover: '#186491'
    },
    {
      name: 'Indigo',
      description: 'A richer premium direction with deeper contrast and strong identity.',
      brand: 'Norell.',
      headline: 'Modern essentials with a bold silhouette and quiet luxury.',
      tag: 'Structured silhouette series ↗',
      dot: '#4c63c7',
      heroBg: '#2b3278',
      heroTop: '#b7c2ff',
      surfaceCard: '#f3f2fb',
      surfaceSoft: 'rgba(255,255,255,0.13)',
      surfaceLine: 'rgba(255,255,255,0.2)',
      text: '#ffffff',
      ink: '#262f60',
      pillBg: '#f1efff',
      image: 'assets/images/purple.jpg',
      buttonBg: '#2b3278',
      buttonText: '#ffffff',
      buttonHover: '#4048a0'
    },
    {
      name: 'Sunset',
      description: 'Warm, expressive tones that feel crafted, tactile, and inviting.',
      brand: 'Avara.',
      headline: 'Material-led design made to feel warm, timeless, and human.',
      tag: 'Soft structure essentials ↗',
      dot: '#f96a24',
      heroBg: '#6f2f1f',
      heroTop: '#f1b36d',
      surfaceCard: '#fff5ec',
      surfaceSoft: 'rgba(255,255,255,0.12)',
      surfaceLine: 'rgba(255,255,255,0.18)',
      text: '#fff8f1',
      ink: '#5a2c24',
      pillBg: '#fff0e3',
      image: 'assets/images/red.jpg',
      buttonBg: '#6f2f1f',
      buttonText: '#ffffff',
      buttonHover: '#964734'
    }
  ];

  hovering = false;

  setTheme(index: number): void {
    this.activeTheme = index;
    this.runPreviewAnimation();
  }

  private runPreviewAnimation(): void {
    this.animatePreview = false;

    setTimeout(() => {
      this.animatePreview = true;
    }, 10);

    setTimeout(() => {
      this.animatePreview = false;
    }, 420);
  }
}
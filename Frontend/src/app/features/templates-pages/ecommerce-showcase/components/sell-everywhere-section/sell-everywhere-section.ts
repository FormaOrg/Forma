import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

interface SellCard {
  id: number;
  title: string;
  desc: string;
  textColor: string;
  bg: string;
  image: string;
  btn_theme: 'black' | 'white';
  btn_txt_color: string;
  btn_bg: string;
}

@Component({
  selector: 'app-ecommerce-sell-everywhere-section',
  standalone: true,
  imports: [CommonModule, LinkButton],
  templateUrl: './sell-everywhere-section.html',
  styleUrl: './sell-everywhere-section.css',
})
export class SellEverywhereSection implements AfterViewInit {
  @ViewChild('outerEl') outerEl!: ElementRef<HTMLElement>;

  readonly activeIndex = signal(0);

  cards: SellCard[] = [
    {
      id: 1,
      title: 'Sell on your website',
      desc: 'Engage directly with shoppers and own their full customer journey by selling on your own eCommerce website that fully represents your brand.',
      textColor: '#000000',
      bg: '#ff8044',
      image: 'assets/Ecommerce Showcase/Sell Everywhere/website.jpg',
      btn_theme: 'black',
      btn_txt_color: 'white',
      btn_bg: '#000'
    },
    {
      id: 2,
      title: 'Sell in-person',
      desc: 'Offer products in-store with Forma Retail POS or on-the-go with Forma Mobile POS and sync all your inventory and orders.',
      textColor: '#000000',
      bg: '#d1e6d1',
      image: 'assets/Ecommerce Showcase/Sell Everywhere/inperson.jpg',
      btn_theme: 'black',
      btn_txt_color: 'white',
      btn_bg: '#000'
    },
    {
      id: 3,
      title: 'Sell internationally',
      desc: 'Take your eCommerce website to international markets with Forma Multilingual, currency converter and 80+ trusted payment providers around the world.',
      textColor: '#ffffff',
      bg: '#223246',
      image: 'assets/Ecommerce Showcase/Sell Everywhere/international.jpg',
      btn_theme: 'white',
      btn_txt_color: 'black',
      btn_bg: '#fff'
    },
    {
      id: 4,
      title: 'Sell on marketplaces',
      desc: 'Reach millions of shoppers by listing your products on leading marketplaces and social platforms, all managed from one place.',
      textColor: '#000000',
      bg: '#8cbaff',
      image: 'assets/Ecommerce Showcase/Sell Everywhere/marketplaces.jpg',
      btn_theme: 'black',
      btn_txt_color: 'white',
      btn_bg: '#000'
    },
  ];

  ngAfterViewInit(): void {
    this.onScroll();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.outerEl) return;

    const rect = this.outerEl.nativeElement.getBoundingClientRect();
    const scrolledIn = -rect.top; // 0 at section top, grows as we scroll down

    if (scrolledIn < 0) {
      // Haven't reached section yet
      this.activeIndex.set(0);
      return;
    }

    const totalScroll = rect.height - window.innerHeight;
    if (scrolledIn >= totalScroll) {
      // Past section end — show last card
      this.activeIndex.set(this.cards.length - 1);
      return;
    }

    // Map scroll progress to card index
    const progress = scrolledIn / totalScroll;
    const index = Math.min(
      Math.floor(progress * this.cards.length),
      this.cards.length - 1
    );
    this.activeIndex.set(index);
  }
}
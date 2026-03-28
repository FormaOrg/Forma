import { Component, signal } from '@angular/core';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

type ProductItem = {
  question: string;
  answer: string;
  image: string;
};

@Component({
  selector: 'app-ecommerce-products-section',
  imports: [LinkButton],
  templateUrl: './products-section.html',
  styleUrl: './products-section.css',
})
export class ProductsSection {
  readonly items = signal<ProductItem[]>([
    {
      question: 'Physical products',
      answer: 'Add an extensive catalog of products to your online store with up to 1,000 variants each. Import and export CSV files with products or seamlessly migrate your catalog with the Cart2Cart app.',
      image: 'assets/Ecommerce Showcase/Products/1.jpg'
    },
    {
      question: 'Dropshipping',
      answer: 'Create a dropshipping store with ready-to-sell products through Forma, or a third-party app, and let suppliers take care of fulfillment.',
      image: 'assets/Ecommerce Showcase/Products/2.jpg'
    },
    {
      question: 'Print on demand',
      answer: 'Add your designs to hundreds of high-quality products, from t-shirts to headphones and let suppliers ship your custom merchandise directly to customers.',
      image: 'assets/Ecommerce Showcase/Products/3.jpg'
    },
    {
      question: 'Digital products',
      answer: 'Sell digital goods such as music files, ebooks, online courses, images or gift cards.',
      image: 'assets/Ecommerce Showcase/Products/4.jpg'
    },
    {
      question: 'Subscriptions',
      answer: 'Easily create and manage recurring products and sell subscriptions to generate a steady revenue stream.',
      image: 'assets/Ecommerce Showcase/Products/5.jpg'
    },
  ]);

  // Start with first item open
  readonly openIndex = signal<number>(0);

  toggleItem(index: number): void {
    // Do nothing if clicking the already-open item
    if (this.openIndex() === index) return;
    this.openIndex.set(index);
  }

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }
}
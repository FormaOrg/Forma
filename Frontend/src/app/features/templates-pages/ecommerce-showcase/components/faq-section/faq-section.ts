import { Component, signal } from '@angular/core';

type FaqItem = {
  question: string;
  answer: string;
};

@Component({
  selector: 'app-ecommerce-faq-section',
  imports: [],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.css',
})
export class FaqSection {
  readonly faqs = signal<FaqItem[]>([
    {
      question: 'What is an eCommerce website?',
      answer:
        'An eCommerce website is a website where you can buy or sell physical or digital products online. It usually includes a storefront, product pages, shopping cart, secure checkout, and backend tools to manage payments, shipping, customer support, and marketing.',
    },
    {
      question: 'What do I need in order to build an eCommerce website?',
      answer:
        'To build an eCommerce website, you need: \n\n' +
        '1. A domain name that matches your brand.\n' +
        '2. Hosting infrastructure to keep your store online and fast.\n' +
        '3. Products or services to sell (physical, digital, or dropshipping).\n' +
        '4. A payment provider so customers can pay securely.\n' +
        '5. A store template/design system you can customize.\n\n' +
        'With Forma, you can manage all of this in one place.',
    },
    {
      question: 'How do I build an eCommerce website?',
      answer:
        'Here are 6 simple steps:\n\n' +
        '1. Choose your platform and plan.\n' +
        '2. Plan your store design and customer flow.\n' +
        '3. Add products, pricing, descriptions, and images.\n' +
        '4. Configure checkout and connect payment methods.\n' +
        '5. Set shipping, taxes, and store policies.\n' +
        '6. Test on desktop/mobile, publish, and start selling.\n\n' +
        'On Forma, you can do all of this from one dashboard with no-code editing tools.',
    },
    {
      question: 'Where can I host my eCommerce website?',
      answer:
        'Your eCommerce website is hosted on Forma when you publish with an active paid plan. Hosting includes secure infrastructure, performance optimization, and SSL protection so your store can run reliably for customers.',
    },
    {
      question: 'How can I promote my eCommerce business website?',
      answer:
        'You can promote your store using SEO, email campaigns, social media content, and paid ads. Forma supports key growth workflows like product-focused pages, search-ready structure, and marketing integrations so you can attract traffic and convert visitors into customers.',
    },
    {
      question: 'How secure are eCommerce platforms for handling customer payments?',
      answer:
        'Modern eCommerce platforms are secure when they follow industry standards and use trusted payment providers. Important protections include HTTPS/SSL encryption, secure payment gateways, fraud checks, and continuous security maintenance. Forma is designed with secure payment handling practices to help protect both merchants and customers.',
    },
  ]);

  readonly openIndex = signal<number>(-1);

  toggleItem(index: number): void {
    this.openIndex.set(this.openIndex() === index ? -1 : index);
  }

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }
}
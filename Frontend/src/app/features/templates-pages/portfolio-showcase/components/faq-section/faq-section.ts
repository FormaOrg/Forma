import { Component, signal } from '@angular/core';

type FaqItem = {
    question: string;
    answer: string;
};

@Component({
  selector: 'app-faq-section',
  imports: [],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.css',
})
export class FaqSection {
  readonly faqs = signal<FaqItem[]>([
    {
      question: 'What is a portfolio website?',
      answer: 'A portfolio website is a digital platform for professionals and creatives that showcases your work, skills, and story to attract employers, clients, or collaborators. It acts as your dynamic online storefront—a curated collection of projects, a personal narrative, and a clear way for people to connect with you and your unique professional brand.'
    },
    {
      question: 'Why make an online portfolio?',
      answer: 'An online portfolio is your digital storefront, showcasing your best work and abilities. It\'s the perfect way to make a lasting impression and land your next big opportunity. Forma simplifies your online portfolio setup so you can showcase your best work, control your story, expand your reach globally, and build credibility through visible results and examples.'
    },
    {
      question: 'What kind of portfolios can I build on Forma?',
      answer: 'Forma offers beautiful portfolio website templates you can customize. Whether you\'re looking to share your creativity, build a professional portfolio, or attract clients, Forma makes it easy for art, photography, interior design, architecture, video, illustration, modeling, music, and more.'
    },
    {
      question: 'What makes a good online portfolio?',
      answer: 'A good portfolio typically includes a space to showcase your projects, an "about me" section, and your contact info. Make it easy to navigate by organizing your work into projects, show only your best work, use a visually appealing design with high quality images and videos, and include client testimonials or other social proof to build your credibility.'
    },
    {
      question: 'Is it free to make a site with the portfolio website maker?',
      answer: 'Yes — building your portfolio on Forma is completely free. You get full access to the drag-and-drop editor, all templates, and every design tool to create your site. When you\'re ready to go live and share it with the world, a subscription plan is required to publish. This way you can take your time crafting the perfect portfolio before committing.'
    },
    {
      question: 'Does my free portfolio website come with hosting?',
      answer: 'Yes. When you create a website with Forma, you get reliable, scalable multi-cloud hosting that ensures 99.99% uptime, automatic disaster recovery, worldwide CDN coverage, 2 layers of DDoS protection, 24/7 security monitoring, and HTTPS and SSL protection.'
    },
    {
      question: 'How can I make sure my site looks good on mobile devices?',
      answer: 'Forma automatically creates a mobile-friendly portfolio website using the design and content from your desktop version. You can also use the integrated mobile editor to further customize and enhance your mobile site experience.'
    },
    {
      question: 'How can I optimize my site for SEO?',
      answer: 'All Forma sites are designed with SEO best practices in mind and come with built-in SEO tools. Customize your SEO settings, generate meta tags and descriptions, get instant homepage indexing, and use the SEO assistant that analyzes your pages and gives recommendations. Key integrations like Google Search Console are also included.'
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
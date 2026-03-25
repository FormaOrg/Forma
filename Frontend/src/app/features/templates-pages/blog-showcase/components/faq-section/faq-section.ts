import { Component, signal } from '@angular/core';

type FaqItem = {
    question: string;
    answer: string;
};
 

@Component({
  selector: 'app-blog-faq-section',
  imports: [],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.css',
})
export class FaqSection {
  readonly faqs = signal<FaqItem[]>([
    {
      question: 'Is it free to start a blog?',
      answer: 'Building your blog on Forma is completely free. You get full access to the drag-and-drop editor, all templates, and every design tool to create and write your blog. When you\'re ready to publish and share it with the world, a subscription plan is required to go live.'
    },
    {
      question: 'How do blogs make money?',
      answer: 'There are many ways to monetize a blog. You can offer paid subscriptions for exclusive content, use third-party ad networks to earn commission, sell digital products or merchandise, or offer sponsored content partnerships. Forma gives you the tools to set up these revenue streams — monetization features are coming soon to make it even easier.'
    },
    {
      question: 'Can I import blog posts from another platform?',
      answer: 'Blog import tools are on our roadmap and will be available soon. In the meantime, you can easily create and publish new posts directly in Forma\'s editor, with a clean writing experience designed to keep you focused on your content.'
    },
    {
      question: 'Is Forma only for beginner bloggers?',
      answer: 'Not at all. Forma is built for every level — from first-time writers to seasoned content creators. The platform combines an intuitive drag-and-drop interface with powerful tools like built-in SEO, analytics, and flexible layouts, so you can grow your blog without ever outgrowing the platform.'
    },
    {
      question: 'What should I blog about?',
      answer: 'You can create a blog about almost anything. The most important thing is to be passionate about your topic. Popular blog types include lifestyle, travel, food, fashion, tech, and business. Whether it\'s a personal journal or a professional publication, consistency and authenticity are the keys to building an audience.'
    },
    {
      question: 'Does my blog come with hosting?',
      answer: 'Yes. When you publish with Forma, you get reliable, scalable multi-cloud hosting that ensures 99.99% uptime, worldwide CDN coverage, DDoS protection, 24/7 security monitoring, and HTTPS and SSL protection — all included in your subscription plan.'
    },
    {
      question: 'Will my blog look good on mobile?',
      answer: 'Forma automatically creates a mobile-friendly version of your blog using the design and content from your desktop layout. You can also use the integrated mobile editor to fine-tune the experience for your readers on the go.'
    },
    {
      question: 'How can I grow my blog\'s traffic with SEO?',
      answer: 'All Forma sites are built with SEO best practices in mind. You can customize your SEO settings per post, add meta titles and descriptions, and get indexing support. An SEO assistant that analyzes your content and gives improvement recommendations is coming soon.'
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

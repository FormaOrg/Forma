import { Component } from '@angular/core';
import { ContactHero } from './components/contact-hero/contact-hero';
import { Header } from '../../../shared/header/header';
import { Footer } from '../../../shared/footer/footer';
import { ContactFormSection } from './components/contact-form-section/contact-form-section';
import { ContactSection } from './components/contact-section/contact-section';

@Component({
  selector: 'app-contact',
  imports: [
    Header,
    ContactHero,
    ContactFormSection,
    ContactSection,
    Footer
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {

}

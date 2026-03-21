import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-faqs-hero-section',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './faqs-hero-section.html',
  styleUrl: './faqs-hero-section.css',
})
export class FaqsHeroSection {
  categories: string[] = [
    'Getting Started',
    'Billing',
    'Account',
    'Website Editor',
    'Bookings',
    'Store',
    'Domains',
    'Troubleshooting'
  ];

  searchQuery = '';
}

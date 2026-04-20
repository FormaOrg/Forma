import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CourseCard {
  title: string;
  description: string;
  lessons: string;
  duration: string;
  cta: string;
  image: string;
  imageAlt: string;
  variant: 'large' | 'small';
}

@Component({
  selector: 'app-tutorials-courses-section',
  imports: [
    CommonModule
  ],
  templateUrl: './courses-section.html',
  styleUrl: './courses-section.css',
})
export class CoursesSection {
  heading = 'Cover the basics with courses that are anything but basic';

  cards: CourseCard[] = [
    {
      title: 'Build your website\nwith the Forma Editor',
      description:
        'Learn how to create, build and customize your professional website exactly the way you want.',
      lessons: '9 lessons',
      duration: '69m',
      cta: 'Start Now',
      image: 'assets/images/course-editor.avif',
      imageAlt: 'Website editor course preview',
      variant: 'large'
    },
    {
      title: 'Set up & manage your\nonline bookings',
      description:
        'Start accepting and managing online bookings for appointments, classes and courses, right from your website.',
      lessons: '7 lessons',
      duration: '42m',
      cta: 'Start Now',
      image: 'assets/images/course-bookings.avif',
      imageAlt: 'Online bookings course preview',
      variant: 'small'
    },
    {
      title: 'Drive traffic to your\nonline store',
      description:
        'Learn how to generate traffic, promote your brand and grow sales.',
      lessons: '9 lessons',
      duration: '37m',
      cta: 'Start Now',
      image: 'assets/images/course-sales.avif',
      imageAlt: 'Online store sales course preview',
      variant: 'small'
    }
  ];

  get largeCard(): CourseCard {
    return this.cards[0];
  }

  get sideCards(): CourseCard[] {
    return this.cards.slice(1);
  }
}

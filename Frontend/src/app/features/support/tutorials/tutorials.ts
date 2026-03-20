import { Component } from '@angular/core';
import { Header } from '../../../shared/header/header';
import { TutorialsMainSection } from './components/tutorials-main-section/tutorials-main-section';
import { Footer } from '../../../shared/footer/footer';
import { CoursesSection } from './components/courses-section/courses-section';
import { LearningStages } from './components/learning-stages/learning-stages';

@Component({
  selector: 'app-tutorials',
  imports: [
    Header,
    TutorialsMainSection,
    CoursesSection,
    LearningStages,
    Footer
  ],
  templateUrl: './tutorials.html',
  styleUrl: './tutorials.css',
})
export class Tutorials {

}

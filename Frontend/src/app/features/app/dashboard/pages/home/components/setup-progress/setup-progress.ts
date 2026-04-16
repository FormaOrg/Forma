import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomeSetupStep } from '../../home.model';

@Component({
  selector: 'app-setup-progress',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setup-progress.html',
  styleUrl: './setup-progress.css'
})
export class SetupProgress {
  @Input() percent = 0;
  @Input() settingsRoute = '/app/settings';
  @Input() steps: HomeSetupStep[] = [];
}

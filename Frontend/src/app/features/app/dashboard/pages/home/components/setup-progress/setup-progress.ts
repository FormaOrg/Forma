import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type SetupStep = {
  id: string;
  label: string;
  done: boolean;
};

@Component({
  selector: 'app-setup-progress',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './setup-progress.html',
  styleUrl: './setup-progress.css'
})
export class SetupProgress {
  @Input() percent = 66;
  @Input() settingsRoute = '/app/settings';

  readonly steps: SetupStep[] = [
    { id: 'profile', label: 'Complete profile', done: true },
    { id: 'site', label: 'Publish a site', done: true },
    { id: 'domain', label: 'Connect custom domain', done: false }
  ];
}

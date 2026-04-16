import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-snapshot',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './account-snapshot.html',
  styleUrl: './account-snapshot.css'
})
export class AccountSnapshot {
  @Input() planLabel = 'Free';
  @Input() renewsLabel = 'No active plan';
  @Input() badges: string[] = [];
  @Input() billingRoute = '/app/billing';
}

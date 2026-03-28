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
  @Input() planLabel = 'Pro';
  @Input() renewsLabel = 'Renews Apr 12, 2026';
  @Input() billingRoute = '/app/billing';
}

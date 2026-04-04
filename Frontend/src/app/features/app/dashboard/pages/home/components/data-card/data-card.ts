import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-data-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-card.html',
  styleUrl: './data-card.css',
})
export class DataCard {
  private _icon = '';

  @Input() title = '';
  @Input() value = '';
  @Input() description = '';

  safeIcon: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  @Input()
  set icon(value: string) {
    this._icon = value ?? '';
    this.safeIcon = this.sanitizer.bypassSecurityTrustHtml(this._icon);
  }

  get icon(): string {
    return this._icon;
  }
}

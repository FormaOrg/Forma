import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-forma-process-showcase',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './forma-process-showcase.html',
  styleUrl: './forma-process-showcase.css',
})
export class FormaProcessShowcaseComponent implements AfterViewInit {
  @ViewChild('showcase', { static: true }) showcaseRef!: ElementRef<HTMLElement>;

  readonly progress = signal(0);
  readonly draftPhase = signal(1);
  readonly structurePhase = signal(0);
  readonly polishPhase = signal(0);

  readonly canvasStyles = computed(() => ({
    '--progress': String(this.progress()),
    '--draft': String(this.draftPhase()),
    '--structure': String(this.structurePhase()),
    '--polish': String(this.polishPhase()),
  }));

  ngAfterViewInit(): void {
    setTimeout(() => this.updateProgress(), 0);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  updateProgress(): void {
    const el = this.showcaseRef?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || 1;

    const totalScrollable = Math.max(rect.height - viewportH, 1);
    const traveled = this.clamp(-rect.top, 0, totalScrollable);
    const progress = traveled / totalScrollable;

    this.progress.set(progress);

    const draft = 1 - this.mapRange(progress, 0.08, 0.34);
    const structure = this.mapRange(progress, 0.16, 0.68);
    const polish = this.mapRange(progress, 0.58, 1);

    this.draftPhase.set(draft);
    this.structurePhase.set(structure);
    this.polishPhase.set(polish);
  }

  private mapRange(value: number, inMin: number, inMax: number): number {
    if (inMax === inMin) return 0;
    return this.clamp((value - inMin) / (inMax - inMin), 0, 1);
  }

  private clamp(value: number, min = 0, max = 1): number {
    return Math.min(Math.max(value, min), max);
  }
}

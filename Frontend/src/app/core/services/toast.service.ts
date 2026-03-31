import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
  isClosing: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly exitDuration = 220;
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, type: ToastType = 'info', duration = 4500): number {
    const id = this.nextId++;
    const toast: ToastItem = { id, type, message, duration, isClosing: false };

    this.toasts.update(items => [...items, toast]);

    if (duration > 0) {
      window.setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  info(message: string, duration?: number): number {
    return this.show(message, 'info', duration);
  }

  success(message: string, duration?: number): number {
    return this.show(message, 'success', duration);
  }

  warning(message: string, duration?: number): number {
    return this.show(message, 'warning', duration);
  }

  error(message: string, duration?: number): number {
    return this.show(message, 'error', duration);
  }

  dismiss(id: number): void {
    let shouldRemove = false;

    this.toasts.update(items =>
      items.map(item => {
        if (item.id !== id || item.isClosing) {
          return item;
        }

        shouldRemove = true;
        return { ...item, isClosing: true };
      })
    );

    if (shouldRemove) {
      window.setTimeout(() => {
        this.toasts.update(items => items.filter(item => item.id !== id));
      }, this.exitDuration);
    }
  }

  clear(): void {
    this.toasts.set([]);
  }
}

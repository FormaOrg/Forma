import { Injectable, signal } from '@angular/core';
import { PublicStorefrontProduct, StoreCartItem } from '../models/public-storefront.model';

type CartState = Record<string, StoreCartItem[]>;

@Injectable({ providedIn: 'root' })
export class StoreCartService {
  private readonly storageKey = 'forma-store-cart';
  private readonly carts = signal<CartState>(this.readInitialState());

  itemsFor(projectId: number): StoreCartItem[] {
    return this.carts()[this.projectKey(projectId)] ?? [];
  }

  countFor(projectId: number): number {
    return this.itemsFor(projectId).reduce((sum, item) => sum + item.quantity, 0);
  }

  subtotalFor(projectId: number): number {
    return this.itemsFor(projectId).reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addItem(projectId: number, product: PublicStorefrontProduct, quantity = 1): void {
    if (quantity < 1) {
      return;
    }

    this.updateProjectCart(projectId, (items) => {
      const existing = items.find((item) => item.productId === product.id);
      if (existing) {
        return items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...items,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity,
        },
      ];
    });
  }

  updateQuantity(projectId: number, productId: number, quantity: number): void {
    this.updateProjectCart(projectId, (items) => {
      if (quantity <= 0) {
        return items.filter((item) => item.productId !== productId);
      }

      return items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }

  removeItem(projectId: number, productId: number): void {
    this.updateProjectCart(projectId, (items) => items.filter((item) => item.productId !== productId));
  }

  clear(projectId: number): void {
    this.updateProjectCart(projectId, () => []);
  }

  private updateProjectCart(projectId: number, updater: (items: StoreCartItem[]) => StoreCartItem[]): void {
    const key = this.projectKey(projectId);
    this.carts.update((state) => {
      const nextItems = updater(state[key] ?? []);
      const nextState = { ...state, [key]: nextItems };
      this.persist(nextState);
      return nextState;
    });
  }

  private readInitialState(): CartState {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return {};
      }

      return JSON.parse(raw) as CartState;
    } catch {
      return {};
    }
  }

  private persist(state: CartState): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private projectKey(projectId: number): string {
    return String(projectId);
  }
}

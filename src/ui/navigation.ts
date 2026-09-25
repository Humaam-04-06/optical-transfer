/**
 * SpectraBeam - Client-Side Hash Router
 * Guaranteed instantaneous route mounting on first load and hashchange.
 */

import { PageRoute } from '../core/types.ts';

export type RouteListener = (route: PageRoute) => void;

export class Router {
  private static listeners: RouteListener[] = [];
  private static currentRoute: PageRoute = 'home';
  private static isInitialized = false;

  private static parseRoute(): PageRoute {
    const rawHash = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#\/?/, '').toLowerCase();
    if (rawHash === 'send' || rawHash === 'receive' || rawHash === 'enclave' || rawHash === 'benchmark') {
      return rawHash as PageRoute;
    }
    return 'home';
  }

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.currentRoute = this.parseRoute();

    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    this.broadcast();
  }

  public static navigate(route: PageRoute): void {
    window.location.hash = `#${route}`;
  }

  public static getRoute(): PageRoute {
    return this.parseRoute();
  }

  public static subscribe(listener: RouteListener): () => void {
    this.listeners.push(listener);
    // Immediately invoke subscriber with the parsed route upon subscribing
    this.currentRoute = this.parseRoute();
    listener(this.currentRoute);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static handleHashChange(): void {
    this.currentRoute = this.parseRoute();
    this.broadcast();
  }

  private static broadcast(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentRoute);
      } catch (err) {
        console.error('Router listener error:', err);
      }
    }
  }
}

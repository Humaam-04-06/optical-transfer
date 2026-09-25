/**
 * SpectraBeam - Client-Side Hash Router
 */

import { PageRoute } from '../core/types.ts';

export type RouteListener = (route: PageRoute) => void;

export class Router {
  private static listeners: RouteListener[] = [];
  private static currentRoute: PageRoute = 'home';

  public static init(): void {
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });
    this.handleHashChange();
  }

  public static navigate(route: PageRoute): void {
    window.location.hash = `#${route}`;
  }

  public static getRoute(): PageRoute {
    return this.currentRoute;
  }

  public static subscribe(listener: RouteListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static handleHashChange(): void {
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    let targetRoute: PageRoute = 'home';

    if (rawHash === 'send' || rawHash === 'receive' || rawHash === 'enclave' || rawHash === 'benchmark') {
      targetRoute = rawHash as PageRoute;
    }

    this.currentRoute = targetRoute;
    for (const listener of this.listeners) {
      listener(this.currentRoute);
    }
  }
}

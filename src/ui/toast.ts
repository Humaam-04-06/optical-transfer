/**
 * SpectraBeam - Futuristic Toast Notification System
 */

export class Toast {
  private static container: HTMLDivElement | null = null;

  private static ensureContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  public static show(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3500): void {
    const container = this.ensureContainer();
    const item = document.createElement('div');
    item.className = `toast-item toast-${type}`;
    item.innerHTML = `
      <div class="toast-indicator"></div>
      <div class="toast-content">${message}</div>
    `;

    container.appendChild(item);

    // Trigger enter animation
    requestAnimationFrame(() => {
      item.classList.add('toast-visible');
    });

    setTimeout(() => {
      item.classList.remove('toast-visible');
      setTimeout(() => item.remove(), 300);
    }, duration);
  }

  public static success(msg: string): void {
    this.show(msg, 'success');
  }

  public static error(msg: string): void {
    this.show(msg, 'error', 5000);
  }

  public static warning(msg: string): void {
    this.show(msg, 'warning', 4000);
  }
}

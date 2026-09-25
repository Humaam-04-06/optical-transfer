/**
 * SpectraBeam - Diagnostics & Chroma Lab (Benchmark Page)
 */

import { buildRobustSolitonCDF } from '../../core/soliton.ts';
import { Toast } from '../../ui/toast.ts';
import { Icons } from '../../ui/icons.ts';

export class BenchmarkPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="page-container benchmark-page">
        <div class="page-header">
          <div class="title-group">
            <h2 class="page-title"><span class="title-icon">${Icons.activity}</span> Diagnostics & Chroma Lab</h2>
            <p class="page-subtitle">Stress-test optical frame rates, fountain math, and RGB channel calibration</p>
          </div>
          <div class="header-badges">
            <span class="status-badge live-badge">BENCHMARK LAB</span>
          </div>
        </div>

        <div class="benchmark-grid">
          <!-- Soliton Mathematics Visualizer -->
          <div class="card glass-panel bench-card">
            <div class="bench-header">
              <span class="icon-accent">${Icons.cpu}</span>
              <div>
                <h3>Robust Soliton Distribution (K-Blocks)</h3>
                <p>Luby Transform degree probability distribution</p>
              </div>
            </div>

            <div class="bench-controls">
              <label for="solitonK">K Blocks: <strong id="kLabel">100</strong></label>
              <input type="range" id="solitonK" min="10" max="500" value="100" class="cyber-range" />
            </div>

            <div class="soliton-canvas-box">
              <canvas id="solitonCanvas" width="500" height="200"></canvas>
            </div>
            <p class="bench-note">
              Soliton distribution ensures degree-1 packets seed the peeling decoder while higher-degree packets maximize overall entropy.
            </p>
          </div>

          <!-- Screen Refresh & Camera Sync Tester -->
          <div class="card glass-panel bench-card">
            <div class="bench-header">
              <span class="icon-accent">${Icons.zap}</span>
              <div>
                <h3>Display Refresh Synchronization</h3>
                <p>Verify browser frame dispatch rate (Hz)</p>
              </div>
            </div>

            <div class="fps-meter-box">
              <div class="fps-display">
                <span id="measuredFps" class="fps-number">--</span>
                <span class="fps-unit">FPS</span>
              </div>
              <div class="fps-bar-track">
                <div id="fpsBarFill" class="fps-bar-fill" style="width: 0%"></div>
              </div>
            </div>

            <div class="bench-actions">
              <button id="btnRunFpsTest" class="btn btn-secondary btn-full">
                ${Icons.activity} Measure Display Refresh Rate
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.drawSoliton(100);
  }

  private bindEvents(): void {
    const solitonK = this.container.querySelector('#solitonK') as HTMLInputElement;
    const kLabel = this.container.querySelector('#kLabel') as HTMLElement;
    const btnRunFpsTest = this.container.querySelector('#btnRunFpsTest') as HTMLButtonElement;

    solitonK.addEventListener('input', () => {
      const k = parseInt(solitonK.value, 10);
      kLabel.textContent = `${k}`;
      this.drawSoliton(k);
    });

    btnRunFpsTest.addEventListener('click', () => {
      this.measureFps();
    });
  }

  private drawSoliton(K: number): void {
    const canvas = this.container.querySelector('#solitonCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cdf = buildRobustSolitonCDF(K);

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 1; i <= K; i++) {
      const x = (i / K) * canvas.width;
      const y = canvas.height - (cdf[i] * canvas.height * 0.9 + 10);
      if (i === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill gradient under curve
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 242, 254, 0.1)';
    ctx.fill();
  }

  private measureFps(): void {
    const measuredFpsEl = this.container.querySelector('#measuredFps') as HTMLElement;
    const fpsBarFill = this.container.querySelector('#fpsBarFill') as HTMLElement;

    let frames = 0;
    const start = performance.now();

    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed < 1000) {
        requestAnimationFrame(tick);
      } else {
        const fps = Math.round((frames * 1000) / elapsed);
        measuredFpsEl.textContent = `${fps}`;
        fpsBarFill.style.width = `${Math.min(100, (fps / 120) * 100)}%`;
        Toast.success(`Measured Display Refresh: ${fps} Hz`);
      }
    };

    requestAnimationFrame(tick);
  }

  public destroy(): void {}
}

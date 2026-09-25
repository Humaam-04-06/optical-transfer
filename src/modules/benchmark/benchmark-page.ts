/**
 * SpectraBeam - Diagnostics & Chroma Lab (Benchmark Page)
 * Playful Geometric Theme Implementation (100% Fluid & Responsive)
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
      <div class="space-y-6 sm:space-y-8 animate-pop-in">
        
        <!-- Page Title Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E293B] pb-5">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#8B5CF6] text-white border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-2 flex-shrink-0">
                ${Icons.activity}
              </div>
              <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#1E293B]">Diagnostics & Chroma Lab</h2>
            </div>
            <p class="font-body text-sm sm:text-base text-[#64748B] pl-0 sm:pl-13">
              Stress-test display refresh rates, mathematical Soliton degree distributions, and optical benchmarks
            </p>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto">
            <span class="badge-pill bg-[#FBBF24] text-[#1E293B]">
              <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
              <span>BENCHMARK SUITE</span>
            </span>
          </div>
        </div>

        <!-- 100% Responsive Grid: 2 equal cards on desktop, stacked on mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          <!-- Soliton Mathematics Visualizer Sticker Card -->
          <div class="card-sticker shadow-pop-lg bg-white p-5 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 border-b-2 border-[#1E293B] pb-3.5">
              <div class="w-10 h-10 rounded-xl bg-[#8B5CF6] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center text-white flex-shrink-0">
                ${Icons.cpu}
              </div>
              <div>
                <h3 class="font-heading font-black text-lg text-[#1E293B]">Robust Soliton Distribution (CDF)</h3>
                <p class="font-body text-xs text-[#64748B]">Luby Transform degree probability calculation</p>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label for="solitonK" class="font-heading font-bold text-xs uppercase text-[#1E293B]">
                  Payload K-Blocks: <span id="kLabel" class="text-sm font-black text-[#8B5CF6]">100</span>
                </label>
                <span class="text-[11px] font-mono font-bold text-[#64748B]">10 to 500 BLOCKS</span>
              </div>

              <input type="range" id="solitonK" min="10" max="500" value="100" class="w-full accent-[#8B5CF6] cursor-pointer" />
            </div>

            <!-- Soliton Visualizer Canvas Frame -->
            <div class="relative w-full aspect-[2.2/1] bg-[#FFFDF5] rounded-2xl border-2 border-[#1E293B] shadow-pop-sm overflow-hidden p-2">
              <canvas id="solitonCanvas" width="500" height="220" class="w-full h-full object-contain"></canvas>
            </div>

            <div class="p-3.5 rounded-xl bg-[#F8FAFC] border-2 border-[#1E293B] text-xs font-body text-[#64748B] leading-relaxed">
              <strong class="text-[#1E293B] block mb-0.5">Peeling Decoder Mechanics:</strong>
              The Soliton distribution guarantees that low-degree packets (degree 1 and 2) promptly initiate the peeling cascade while higher-degree packets maximize information entropy per frame.
            </div>
          </div>

          <!-- Display Refresh Synchronization Sticker Card -->
          <div class="card-sticker card-sticker-mint shadow-pop-lg bg-white p-5 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 border-b-2 border-[#1E293B] pb-3.5">
              <div class="w-10 h-10 rounded-xl bg-[#34D399] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center text-[#1E293B] flex-shrink-0">
                ${Icons.zap}
              </div>
              <div>
                <h3 class="font-heading font-black text-lg text-[#1E293B]">Display Refresh Synchronization</h3>
                <p class="font-body text-xs text-[#64748B]">Verify browser frame dispatch rate in real time</p>
              </div>
            </div>

            <!-- Big Tactile Meter Box -->
            <div class="p-6 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] shadow-pop-sm text-center space-y-4">
              <div class="flex items-baseline justify-center gap-2">
                <span id="measuredFps" class="font-heading font-black text-5xl sm:text-6xl text-[#1E293B]">--</span>
                <span class="font-heading font-extrabold text-lg text-[#64748B]">HZ / FPS</span>
              </div>

              <!-- Striped Progress Fill -->
              <div class="w-full h-4 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-full overflow-hidden p-0.5 shadow-pop-sm">
                <div id="fpsBarFill" class="h-full bg-[#34D399] candy-progress-striped rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>

              <p class="text-xs font-body text-[#64748B]">
                High-Hz displays (60Hz, 120Hz, 144Hz) enable higher optical throughput without packet tearing.
              </p>
            </div>

            <button id="btnRunFpsTest" class="btn-candy btn-candy-mint btn-full">
              ${Icons.activity} Measure Display Refresh Rate
            </button>
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

    // Draw background guide lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 0.25; y <= 1; y += 0.25) {
      const py = canvas.height - y * (canvas.height - 20) - 10;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }

    // Draw Curve
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 1; i <= K; i++) {
      const x = (i / K) * (canvas.width - 20) + 10;
      const y = canvas.height - (cdf[i] * (canvas.height - 30) + 15);
      if (i === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(canvas.width - 10, canvas.height - 15);
    ctx.lineTo(10, canvas.height - 15);
    ctx.closePath();
    ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
    ctx.fill();
  }

  private measureFps(): void {
    const measuredFpsEl = this.container.querySelector('#measuredFps') as HTMLElement;
    const fpsBarFill = this.container.querySelector('#fpsBarFill') as HTMLElement;

    let frames = 0;
    const start = performance.now();
    measuredFpsEl.textContent = '...';

    const tick = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed < 1000) {
        requestAnimationFrame(tick);
      } else {
        const fps = Math.round((frames * 1000) / elapsed);
        measuredFpsEl.textContent = `${fps}`;
        fpsBarFill.style.width = `${Math.min(100, (fps / 144) * 100)}%`;
        Toast.success(`Display Refresh Rate Measured: ${fps} Hz`);
      }
    };

    requestAnimationFrame(tick);
  }

  public destroy(): void {}
}

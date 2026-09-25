/**
 * SpectraBeam - ChromaBeam RGB 3-Channel Optical Multiplexer
 * 
 * Multiplexes 3 independent fountain frames into Red, Green, and Blue
 * color channels, tripling the optical transmission data density.
 */

import { QRMatrix } from './qr-generator.ts';

export class ChromaBeam {
  /**
   * Merges three QR matrices (R, G, B) into a single RGB color Canvas.
   */
  public static renderRGBFrame(
    redMatrix: QRMatrix,
    greenMatrix: QRMatrix,
    blueMatrix: QRMatrix,
    canvas: HTMLCanvasElement
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxSize = Math.max(redMatrix.size, greenMatrix.size, blueMatrix.size);
    const canvasSize = Math.min(canvas.width, canvas.height);
    const scale = Math.floor(canvasSize / maxSize);
    const offset = Math.floor((canvasSize - maxSize * scale) / 2);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgData = ctx.createImageData(canvasSize, canvasSize);
    const buf = imgData.data;

    // Fill white background for RGB additive mix
    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = 255;     // R
      buf[i + 1] = 255; // G
      buf[i + 2] = 255; // B
      buf[i + 3] = 255; // Alpha
    }

    // Paint R, G, B channels
    for (let r = 0; r < maxSize; r++) {
      for (let c = 0; c < maxSize; c++) {
        const isRedDark = r < redMatrix.size && c < redMatrix.size ? redMatrix.data[r * redMatrix.size + c] === 1 : false;
        const isGreenDark = r < greenMatrix.size && c < greenMatrix.size ? greenMatrix.data[r * greenMatrix.size + c] === 1 : false;
        const isBlueDark = r < blueMatrix.size && c < blueMatrix.size ? blueMatrix.data[r * blueMatrix.size + c] === 1 : false;

        const startX = offset + c * scale;
        const startY = offset + r * scale;

        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const pixelIdx = ((startY + py) * canvasSize + (startX + px)) * 4;
            if (pixelIdx >= 0 && pixelIdx < buf.length) {
              if (isRedDark) buf[pixelIdx] = 0;         // Black in Red channel
              if (isGreenDark) buf[pixelIdx + 1] = 0;   // Black in Green channel
              if (isBlueDark) buf[pixelIdx + 2] = 0;    // Black in Blue channel
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw reference color calibration swatches in the 4 corners
    this.drawCalibrationSwatches(ctx, canvas.width, canvas.height);
  }

  /**
   * Separates a captured RGB camera frame into three separate grayscale Uint8Array buffers
   * ready to be fed in parallel to 3 WASM decode workers.
   */
  public static splitRGBChannels(
    imageData: ImageData
  ): { red: Uint8Array; green: Uint8Array; blue: Uint8Array } {
    const totalPixels = imageData.width * imageData.height;
    const red = new Uint8Array(totalPixels);
    const green = new Uint8Array(totalPixels);
    const blue = new Uint8Array(totalPixels);

    const data = imageData.data;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      red[p] = data[i];       // Red channel intensity
      green[p] = data[i + 1]; // Green channel intensity
      blue[p] = data[i + 2];  // Blue channel intensity
    }

    return { red, green, blue };
  }

  private static drawCalibrationSwatches(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = 14;
    // Top-Left: Red
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(4, 4, s, s);
    // Top-Right: Green
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(w - s - 4, 4, s, s);
    // Bottom-Left: Blue
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(4, h - s - 4, s, s);
    // Bottom-Right: White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w - s - 4, h - s - 4, s, s);
  }
}

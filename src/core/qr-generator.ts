/**
 * SpectraBeam - High-Speed QR Code Matrix Generator & Canvas Renderer
 */

import QRCode from 'qrcode';

export interface QRMatrix {
  size: number;
  data: Uint8Array; // 1 for black, 0 for white
}

export class QRGenerator {
  /**
   * Generates a 2D bit matrix from raw binary frame bytes using Low (L) error correction.
   */
  public static generateMatrix(data: Uint8Array): QRMatrix {
    // Generate QR using binary byte mode
    const qr = QRCode.create(
      [{ data, mode: 'byte' }],
      { errorCorrectionLevel: 'L' }
    );

    const size = qr.modules.size;
    const bitData = new Uint8Array(size * size);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        bitData[r * size + c] = qr.modules.get(r, c) ? 1 : 0;
      }
    }

    return { size, data: bitData };
  }

  /**
   * Renders a QR matrix directly to an HTML5 Canvas with sharp pixel scaling.
   */
  public static renderToCanvas(
    matrix: QRMatrix,
    canvas: HTMLCanvasElement,
    inverted = false,
    strobeNoise = false
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = Math.min(canvas.width, canvas.height);
    const scale = Math.floor(canvasSize / matrix.size);
    const offset = Math.floor((canvasSize - matrix.size * scale) / 2);

    // Background color
    ctx.fillStyle = inverted ? '#000000' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Foreground color
    ctx.fillStyle = inverted ? '#ffffff' : '#000000';

    for (let r = 0; r < matrix.size; r++) {
      for (let c = 0; c < matrix.size; c++) {
        let isDark = matrix.data[r * matrix.size + c] === 1;

        if (strobeNoise && Math.random() < 0.005) {
          isDark = !isDark; // Subtle anti-recording visual noise
        }

        if (isDark) {
          ctx.fillRect(offset + c * scale, offset + r * scale, scale, scale);
        }
      }
    }
  }
}

/**
 * SpectraBeam - Luby Transform (LT) Fountain Encoder & Peeling Decoder
 */

import { buildRobustSolitonCDF, getPacketSubset } from './soliton.ts';

export class FountainEncoder {
  public readonly K: number;
  public readonly blockLength: number;
  public readonly totalLength: number;
  private readonly blocks: Uint8Array[];
  private readonly cdf: Float64Array;
  private sequenceNumber = 0;

  constructor(payload: Uint8Array, blockLength = 512) {
    this.totalLength = payload.length;
    this.blockLength = blockLength;
    this.K = Math.max(1, Math.ceil(this.totalLength / this.blockLength));
    this.cdf = buildRobustSolitonCDF(this.K);

    // Slice payload into K uniform blocks (pad final block with 0s)
    this.blocks = [];
    for (let i = 0; i < this.K; i++) {
      const block = new Uint8Array(this.blockLength);
      const start = i * this.blockLength;
      const end = Math.min(start + this.blockLength, this.totalLength);
      block.set(payload.subarray(start, end));
      this.blocks.push(block);
    }
  }

  /**
   * Generates next fountain packet in the sequence.
   */
  public nextPacket(): { seq: number; indices: number[]; data: Uint8Array } {
    const seq = this.sequenceNumber++;
    const indices = getPacketSubset(seq, this.K, this.cdf);
    const data = new Uint8Array(this.blockLength);

    // XOR all blocks belonging to this subset
    for (const idx of indices) {
      const block = this.blocks[idx];
      for (let b = 0; b < this.blockLength; b++) {
        data[b] ^= block[b];
      }
    }

    return { seq, indices, data };
  }

  /** Reset sequence counter */
  public reset(seq = 0): void {
    this.sequenceNumber = seq;
  }
}

interface EncodedCheckPacket {
  indices: Set<number>;
  data: Uint8Array;
}

export class FountainDecoder {
  public readonly K: number;
  public readonly blockLength: number;
  public readonly totalLength: number;
  private readonly cdf: Float64Array;
  private readonly solvedBlocks: Map<number, Uint8Array> = new Map();
  private readonly activePackets: EncodedCheckPacket[] = [];
  private totalPacketsReceived = 0;

  constructor(K: number, blockLength: number, totalLength: number) {
    this.K = K;
    this.blockLength = blockLength;
    this.totalLength = totalLength;
    this.cdf = buildRobustSolitonCDF(this.K);
  }

  /**
   * Ingests a received packet.
   * Returns true if this packet contributed new information or completed the decode.
   */
  public addPacket(seq: number, packetData: Uint8Array): { isComplete: boolean; newlySolved: number } {
    this.totalPacketsReceived++;

    // Determine the subset from sequence number
    const originalIndices = getPacketSubset(seq, this.K, this.cdf);
    const currentIndices = new Set<number>();
    const data = new Uint8Array(packetData);

    // XOR out all already-solved blocks
    for (const idx of originalIndices) {
      if (this.solvedBlocks.has(idx)) {
        const solved = this.solvedBlocks.get(idx)!;
        for (let b = 0; b < this.blockLength; b++) {
          data[b] ^= solved[b];
        }
      } else {
        currentIndices.add(idx);
      }
    }

    if (currentIndices.size === 0) {
      // Packet is redundant
      return { isComplete: this.isComplete(), newlySolved: 0 };
    }

    let newlySolvedCount = 0;

    // Peeling process: if degree == 1, we immediately solved a block!
    const queue: Array<{ idx: number; data: Uint8Array }> = [];
    if (currentIndices.size === 1) {
      const [solvedIdx] = currentIndices;
      this.solvedBlocks.set(solvedIdx, data);
      queue.push({ idx: solvedIdx, data });
      newlySolvedCount++;
    } else {
      this.activePackets.push({ indices: currentIndices, data });
    }

    // Ripple cascade
    while (queue.length > 0) {
      const { idx: resolvedIdx, data: resolvedData } = queue.shift()!;

      // Reduce all active packets containing resolvedIdx
      for (let i = this.activePackets.length - 1; i >= 0; i--) {
        const p = this.activePackets[i];
        if (p.indices.has(resolvedIdx)) {
          p.indices.delete(resolvedIdx);
          for (let b = 0; b < this.blockLength; b++) {
            p.data[b] ^= resolvedData[b];
          }

          if (p.indices.size === 1) {
            // New block resolved
            const [newIdx] = p.indices;
            if (!this.solvedBlocks.has(newIdx)) {
              this.solvedBlocks.set(newIdx, p.data);
              queue.push({ idx: newIdx, data: p.data });
              newlySolvedCount++;
            }
            this.activePackets.splice(i, 1);
          } else if (p.indices.size === 0) {
            this.activePackets.splice(i, 1);
          }
        }
      }
    }

    return {
      isComplete: this.isComplete(),
      newlySolved: newlySolvedCount,
    };
  }

  public isComplete(): boolean {
    return this.solvedBlocks.size >= this.K;
  }

  public getProgress(): { solved: number; K: number; percentage: number; packetsReceived: number } {
    const solved = this.solvedBlocks.size;
    return {
      solved,
      K: this.K,
      percentage: Math.min(100, Math.round((solved / this.K) * 100)),
      packetsReceived: this.totalPacketsReceived,
    };
  }

  /**
   * Reassembles and returns the original reconstructed payload.
   * Throws if decoding is not yet complete.
   */
  public reconstruct(): Uint8Array {
    if (!this.isComplete()) {
      throw new Error(`Cannot reconstruct payload: ${this.solvedBlocks.size}/${this.K} blocks solved`);
    }

    const result = new Uint8Array(this.totalLength);
    for (let i = 0; i < this.K; i++) {
      const block = this.solvedBlocks.get(i)!;
      const start = i * this.blockLength;
      const end = Math.min(start + this.blockLength, this.totalLength);
      const copyLen = end - start;
      result.set(block.subarray(0, copyLen), start);
    }

    return result;
  }
}

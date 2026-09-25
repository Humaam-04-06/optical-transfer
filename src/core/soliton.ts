/**
 * SpectraBeam - Deterministic Soliton Distribution & PRNG for Fountain Coding
 * 
 * Implements a cross-platform, bit-identical pseudo-random generator
 * using Mulberry32 and deterministic IEEE-754 math.
 */

export class DeterministicPRNG {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Returns next 32-bit unsigned integer */
  public nextUint32(): number {
    let t = (this.s += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Returns uniform float in [0, 1) */
  public nextFloat(): number {
    return (this.nextUint32() >>> 0) / 4294967296;
  }

  /** Returns integer in range [0, max - 1] */
  public nextRange(max: number): number {
    if (max <= 1) return 0;
    return Math.floor(this.nextFloat() * max);
  }
}

/**
 * Builds cumulative probabilities for the Robust Soliton distribution.
 * Soliton guarantees optimal peeling decodability with O(K * ln(K)) packets.
 */
export function buildRobustSolitonCDF(K: number, c = 0.2, delta = 0.05): Float64Array {
  const cdf = new Float64Array(K + 1);
  if (K <= 1) {
    cdf[1] = 1.0;
    return cdf;
  }

  const R = c * Math.log(K / delta) * Math.sqrt(K);
  const pivot = Math.max(1, Math.min(K - 1, Math.floor(K / R)));

  const tau = new Float64Array(K + 1);
  for (let i = 1; i <= K; i++) {
    if (i < pivot) {
      tau[i] = R / (i * K);
    } else if (i === pivot) {
      tau[i] = (R * Math.log(R / delta)) / K;
    } else {
      tau[i] = 0;
    }
  }

  const rho = new Float64Array(K + 1);
  rho[1] = 1.0 / K;
  for (let i = 2; i <= K; i++) {
    rho[i] = 1.0 / (i * (i - 1));
  }

  let beta = 0;
  for (let i = 1; i <= K; i++) {
    beta += rho[i] + tau[i];
  }

  let runningSum = 0;
  for (let i = 1; i <= K; i++) {
    const mu_i = (rho[i] + tau[i]) / beta;
    runningSum += mu_i;
    cdf[i] = runningSum;
  }
  cdf[K] = 1.0; // Ensure exact 1.0 boundary

  return cdf;
}

/**
 * Deterministically chooses degree and subset of chunk indices for a given sequence number.
 */
export function getPacketSubset(seq: number, K: number, cdf: Float64Array): number[] {
  if (K <= 1) return [0];

  const rng = new DeterministicPRNG(seq);
  const u = rng.nextFloat();

  // Binary search CDF for degree
  let degree = 1;
  let low = 1;
  let high = K;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cdf[mid] >= u) {
      degree = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Fisher-Yates partial shuffle to pick 'degree' unique block indices in [0, K-1]
  const indices: number[] = [];
  const selected = new Set<number>();

  while (indices.length < degree) {
    const candidate = rng.nextRange(K);
    if (!selected.has(candidate)) {
      selected.add(candidate);
      indices.push(candidate);
    }
  }

  return indices.sort((a, b) => a - b);
}

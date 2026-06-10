import * as THREE from 'three';

/** n points uniformly inside a sphere of the given radius, as xyz triplets. */
export function randSphere(n: number, radius = 1): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    out[i * 3] = x * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = z * radius;
  }
  return out;
}

/** Standard-normal sample via Box-Muller. */
export function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** n points from an isotropic Gaussian cloud, as xyz triplets. */
export function randGauss(n: number, sigma = 1): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) out[i] = gauss() * sigma;
  return out;
}

/**
 * Ring buffer of line vertices for trails (Lorenz, Brownian walkers).
 * Push points, bind `attribute` to a BufferGeometry position, and the
 * geometry's draw range tracks how much of the buffer is filled.
 */
export class TrailBuffer {
  readonly attribute: THREE.BufferAttribute;
  private readonly max: number;
  private count = 0;

  constructor(maxPoints: number) {
    this.max = maxPoints;
    this.attribute = new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3);
    this.attribute.setUsage(THREE.DynamicDrawUsage);
  }

  push(x: number, y: number, z: number) {
    const arr = this.attribute.array as Float32Array;
    if (this.count < this.max) {
      arr.set([x, y, z], this.count * 3);
      this.count++;
    } else {
      // Shift left one point; cheap enough at trail sizes used here.
      arr.copyWithin(0, 3);
      arr.set([x, y, z], (this.max - 1) * 3);
    }
    this.attribute.needsUpdate = true;
  }

  get drawCount() {
    return this.count;
  }

  writeTo(geometry: THREE.BufferGeometry) {
    geometry.setAttribute('position', this.attribute);
    geometry.setDrawRange(0, this.count);
  }
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

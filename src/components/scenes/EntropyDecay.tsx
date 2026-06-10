import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const COLS = 26;
const ROWS = 16;
const COUNT = COLS * ROWS;

/**
 * Theory 07 — a lattice that rots toward noise, worse on the right. Hovering
 * injects energy and re-orders nearby cells; scroll velocity speeds the decay.
 */
export default function EntropyDecay({ accent, ambient }: SceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { pointer, viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const grayColor = useMemo(() => new THREE.Color('#3a3d4d'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // lattice home, random scatter target, per-cell phase/energy
  const cells = useMemo(() => {
    const home = new Float32Array(COUNT * 3);
    const scatter = new Float32Array(COUNT * 3);
    const energy = new Float32Array(COUNT); // 1 = ordered, 0 = noise
    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      home[i * 3] = (col - COLS / 2 + 0.5) * 0.55;
      home[i * 3 + 1] = (row - ROWS / 2 + 0.5) * 0.55;
      home[i * 3 + 2] = 0;
      scatter[i * 3] = home[i * 3] + (Math.random() - 0.5) * 3;
      scatter[i * 3 + 1] = home[i * 3 + 1] + (Math.random() - 0.5) * 3;
      scatter[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      energy[i] = 1;
    }
    return { home, scatter, energy };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      mesh?.geometry.dispose();
      (mesh?.material as THREE.Material | undefined)?.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const wind = Math.abs(readVelocity());
    const t = state.clock.elapsedTime;
    const px = (pointer.x * viewport.width) / 2;
    const py = (pointer.y * viewport.height) / 2;

    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      // right side decays much faster — order on the left, chaos on the right
      const decayRate = (0.01 + (col / COLS) * 0.12) * (1 + wind * 0.06);
      cells.energy[i] = Math.max(0, cells.energy[i] - decayRate * dt);

      // hovering re-injects energy nearby
      if (!ambient) {
        const dx = cells.home[i * 3] - px;
        const dy = cells.home[i * 3 + 1] - py;
        if (dx * dx + dy * dy < 2.2) {
          cells.energy[i] = Math.min(1, cells.energy[i] + dt * 2.5);
        }
      }

      const e = cells.energy[i];
      const wobble = (1 - e) * Math.sin(t * 2 + i) * 0.12;
      dummy.position.set(
        THREE.MathUtils.lerp(cells.scatter[i * 3], cells.home[i * 3], e) + wobble,
        THREE.MathUtils.lerp(cells.scatter[i * 3 + 1], cells.home[i * 3 + 1], e),
        THREE.MathUtils.lerp(cells.scatter[i * 3 + 2], cells.home[i * 3 + 2], e),
      );
      dummy.rotation.set((1 - e) * t * 0.7 + i, (1 - e) * t * 0.5, 0);
      const s = 0.16 + e * 0.06;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tmpColor.copy(grayColor).lerp(accentColor, e);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const N = 120;
const SPAN = 10;
const GHOSTS = 3;

function betaShape(x: number, a: number, b: number): number {
  // unnormalized Beta pdf; callers rescale by the curve's max
  if (x <= 0 || x >= 1) return 0;
  return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
}

/**
 * Theory 16 — a posterior that sharpens as evidence weights drop. Ghosts of
 * previous priors linger; click to add evidence; scroll re-widens uncertainty.
 */
export default function BayesianUpdate({ accent, ambient }: SceneProps) {
  const params = useRef({ a: 2, b: 2, targetA: 2, targetB: 2 });
  const evidenceTimer = useRef(0);
  const drop = useRef({ active: false, x: 0, y: 0 });
  const dropRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();

  const lines = useMemo(() => {
    const make = (opacity: number) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(N * 3), 3),
      );
      geometry.setDrawRange(0, N);
      const material = new THREE.LineBasicMaterial({
        color: accent,
        transparent: true,
        opacity,
      });
      return { geometry, material, line: new THREE.Line(geometry, material) };
    };
    return {
      current: make(0.95),
      ghosts: Array.from({ length: GHOSTS }, (_, i) => make(0.3 / (i + 1))),
    };
  }, [accent]);

  useEffect(
    () => () => {
      lines.current.geometry.dispose();
      lines.current.material.dispose();
      for (const g of lines.ghosts) {
        g.geometry.dispose();
        g.material.dispose();
      }
    },
    [lines],
  );

  const addEvidence = useMemo(
    () => () => {
      const p = params.current;
      // snapshot the current posterior into the ghost ring
      for (let i = GHOSTS - 1; i > 0; i--) {
        (lines.ghosts[i].geometry.getAttribute('position') as THREE.BufferAttribute).copyArray(
          lines.ghosts[i - 1].geometry.getAttribute('position').array as Float32Array,
        );
        lines.ghosts[i].geometry.getAttribute('position').needsUpdate = true;
      }
      (lines.ghosts[0].geometry.getAttribute('position') as THREE.BufferAttribute).copyArray(
        lines.current.geometry.getAttribute('position').array as Float32Array,
      );
      lines.ghosts[0].geometry.getAttribute('position').needsUpdate = true;

      const hit = Math.random() < 0.72; // most signals are positive intent
      p.targetA += hit ? 1.6 : 0.2;
      p.targetB += hit ? 0.2 : 1.6;
      drop.current = {
        active: true,
        x: (p.targetA / (p.targetA + p.targetB) - 0.5) * SPAN,
        y: 4.6,
      };
    },
    [lines],
  );

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    el.addEventListener('pointerdown', addEvidence);
    return () => el.removeEventListener('pointerdown', addEvidence);
  }, [gl, ambient, addEvidence]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = params.current;
    const wind = Math.abs(readVelocity());

    evidenceTimer.current += dt;
    if (evidenceTimer.current > 3.4) {
      evidenceTimer.current = 0;
      if (p.targetA + p.targetB > 40) {
        // restart the inference loop
        p.targetA = 2;
        p.targetB = 2;
        p.a = 2;
        p.b = 2;
      } else {
        addEvidence();
      }
    }

    p.a += (p.targetA - p.a) * 0.06;
    p.b += (p.targetB - p.b) * 0.06;

    // scroll velocity re-widens uncertainty
    const widen = 1 / (1 + Math.min(wind * 0.012, 0.65));
    const ea = 1 + (p.a - 1) * widen;
    const eb = 1 + (p.b - 1) * widen;

    let max = 0;
    const heights = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      heights[i] = betaShape((i + 0.5) / N, ea, eb);
      if (heights[i] > max) max = heights[i];
    }
    const attr = lines.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      attr.setXYZ(i, (i / (N - 1) - 0.5) * SPAN, -2.6 + (heights[i] / (max || 1)) * 5.6, 0);
    }
    attr.needsUpdate = true;
    lines.current.geometry.computeBoundingSphere();

    // evidence weight falls onto the axis
    if (dropRef.current) {
      const mat = dropRef.current.material as THREE.MeshBasicMaterial;
      if (drop.current.active) {
        drop.current.y -= dt * 9;
        if (drop.current.y <= -2.6) drop.current.active = false;
        dropRef.current.position.set(drop.current.x, drop.current.y, 0);
        mat.opacity = 0.95;
      } else {
        mat.opacity = Math.max(0, mat.opacity - dt * 3);
      }
    }
  });

  return (
    <group>
      <primitive object={lines.current.line} />
      {lines.ghosts.map((g, i) => (
        <primitive key={i} object={g.line} />
      ))}
      <mesh position={[0, -2.62, 0]}>
        <planeGeometry args={[SPAN + 1, 0.02]} />
        <meshBasicMaterial color="#8b8fa3" transparent opacity={0.4} />
      </mesh>
      <mesh ref={dropRef}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0} />
      </mesh>
    </group>
  );
}

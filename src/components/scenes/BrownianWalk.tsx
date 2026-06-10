import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';
import { TrailBuffer, gauss } from './lib/sceneUtils';

const WALKERS = 22;
const TRAIL = 110;
const DEST = new THREE.Vector3(4.6, 0, 0);

/**
 * Theory 14 — random walks with a faint drift toward the destination. The
 * pointer is a repulsive bumper shaping the diffusion field; scroll velocity
 * is temperature.
 */
export default function BrownianWalk({ accent, ambient }: SceneProps) {
  const { pointer, viewport } = useThree();
  const destGlow = useRef<THREE.Mesh>(null);

  const walkers = useMemo(() => {
    return Array.from({ length: WALKERS }, (_, i) => {
      const trail = new TrailBuffer(TRAIL);
      const geometry = new THREE.BufferGeometry();
      trail.writeTo(geometry);
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? '#8b8fa3' : accent,
        transparent: true,
        opacity: 0.16 + (i % 5) * 0.07,
      });
      return {
        trail,
        geometry,
        material,
        line: new THREE.Line(geometry, material),
        pos: new THREE.Vector3(-5.5, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2),
      };
    });
  }, [accent]);

  useEffect(
    () => () => {
      for (const w of walkers) {
        w.geometry.dispose();
        w.material.dispose();
      }
    },
    [walkers],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const heat = 1 + Math.min(Math.abs(readVelocity()) * 0.025, 1.6);
    const px = (pointer.x * viewport.width) / 2;
    const py = (pointer.y * viewport.height) / 2;

    for (const w of walkers) {
      // random step + faint drift + pointer bumper
      w.pos.x += gauss() * 0.085 * heat + (DEST.x - w.pos.x) * 0.0035;
      w.pos.y += gauss() * 0.085 * heat + (DEST.y - w.pos.y) * 0.0035;
      w.pos.z += gauss() * 0.05 * heat - w.pos.z * 0.01;
      if (!ambient) {
        const dx = w.pos.x - px;
        const dy = w.pos.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 3.2) {
          const f = (0.12 * (3.2 - d2)) / 3.2;
          w.pos.x += (dx / Math.sqrt(d2 + 0.01)) * f;
          w.pos.y += (dy / Math.sqrt(d2 + 0.01)) * f;
        }
      }
      // arrived: restart from the left edge
      if (w.pos.distanceTo(DEST) < 0.45) {
        w.pos.set(-5.5, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2);
      }
      w.pos.y = THREE.MathUtils.clamp(w.pos.y, -4.6, 4.6);
      w.trail.push(w.pos.x, w.pos.y, w.pos.z);
      w.geometry.setDrawRange(0, w.trail.drawCount);
      w.geometry.computeBoundingSphere();
    }
    if (destGlow.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
      destGlow.current.scale.setScalar(pulse);
    }
    void dt;
  });

  return (
    <group>
      {walkers.map((w, i) => (
        <primitive key={i} object={w.line} />
      ))}
      <mesh ref={destGlow} position={DEST}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={DEST}>
        <ringGeometry args={[0.55, 0.6, 40]} />
        <meshBasicMaterial color={accent} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

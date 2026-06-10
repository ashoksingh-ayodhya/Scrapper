import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const TWO_PI = Math.PI * 2;
const PERIGEE = 1.7;

/**
 * Theory 01 — leads orbit a central conversion mass. Drag the mass and the
 * orbits decay faster; the retargeting ring lights up whenever a lead passes
 * perigee.
 */
export default function GravityFunnel({ accent, ambient }: SceneProps) {
  const count = ambient ? 160 : 420;
  const pointsRef = useRef<THREE.Points>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const center = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const dragging = useRef(false);
  const { gl, pointer, viewport } = useThree();

  // radius, angle, angular speed, tilt — per lead
  const orbits = useMemo(() => {
    const o = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      o[i * 4] = 2 + Math.random() * 5.5;
      o[i * 4 + 1] = Math.random() * TWO_PI;
      o[i * 4 + 2] = 0.15 + Math.random() * 0.45;
      o[i * 4 + 3] = (Math.random() - 0.5) * 1.4;
    }
    return o;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const down = () => (dragging.current = true);
    const up = () => (dragging.current = false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, ambient]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const wind = Math.abs(readVelocity());
    if (dragging.current) {
      target.current.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0);
    } else {
      target.current.set(0, 0, 0);
    }
    center.current.lerp(target.current, dragging.current ? 0.12 : 0.04);

    let atPerigee = false;
    for (let i = 0; i < count; i++) {
      let r = orbits[i * 4];
      const tilt = orbits[i * 4 + 3];
      orbits[i * 4 + 1] = (orbits[i * 4 + 1] + dt * orbits[i * 4 + 2] * (6 / (r + 0.5))) % TWO_PI;
      r -= dt * 0.07 * (dragging.current ? 3.2 : 1);
      if (r < 0.3) r = 2 + Math.random() * 5.5; // converted — respawn at the rim
      orbits[i * 4] = r;
      if (Math.abs(r - PERIGEE) < 0.12) atPerigee = true;
      const a = orbits[i * 4 + 1];
      const jitter = wind * 0.0045;
      positions[i * 3] = center.current.x + Math.cos(a) * r + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 1] =
        center.current.y + Math.sin(a) * r * (0.55 + Math.abs(tilt) * 0.18) + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 2] = Math.sin(a + tilt) * r * 0.35;
    }
    const attr = pointsRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;

    if (ringMat.current) {
      const goal = atPerigee ? 0.85 : 0.12;
      ringMat.current.opacity += (goal - ringMat.current.opacity) * 0.15;
    }
    if (coreRef.current) {
      coreRef.current.position.copy(center.current);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.06;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color={accent}
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh rotation-x={Math.PI / 2.6}>
        <torusGeometry args={[PERIGEE, 0.02, 8, 80]} />
        <meshBasicMaterial ref={ringMat} color={accent} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

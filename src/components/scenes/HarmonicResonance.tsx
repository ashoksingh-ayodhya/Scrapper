import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const NATURAL = 3.0; // the market's natural frequency

/**
 * Theory 15 — a crystalline structure driven at a pointer-controlled
 * frequency. Hit the natural frequency and the amplitude ramps until the
 * whole thing shatters, then reassembles.
 */
export default function HarmonicResonance({ accent, ambient }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const omega = useRef(1.2);
  const amplitude = useRef(0);
  const shatter = useRef(0); // 0 = intact, ramps to 1 while exploding
  const exploding = useRef(false);
  const { pointer } = useThree();

  const { geometry, base, normals, random } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2.6, 3);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
    const b = new Float32Array(pos.array as Float32Array);
    const n = new Float32Array(nor.array as Float32Array);
    const r = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count * 3; i++) r[i] = (Math.random() - 0.5) * 2;
    return { geometry: geo, base: b, normals: n, random: r };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const detune = Math.min(Math.abs(readVelocity()) * 0.01, 0.8);

    // pointer x is the frequency slider
    const targetOmega = ambient
      ? NATURAL
      : THREE.MathUtils.mapLinear(pointer.x, -1, 1, 0.6, 5.4) + detune;
    omega.current += (targetOmega - omega.current) * 0.05;

    // resonance response: amplitude blows up near the natural frequency
    const response = 0.08 + 0.5 / (Math.abs(omega.current - NATURAL) + 0.12);
    amplitude.current += (Math.min(response, 3.2) - amplitude.current) * 0.04;

    if (!exploding.current && amplitude.current > 2.6) {
      exploding.current = true;
    }
    if (exploding.current) {
      shatter.current += dt * 1.4;
      if (shatter.current >= 1.6) {
        exploding.current = false;
        shatter.current = 0;
        amplitude.current = 0;
        omega.current = 0.8; // knocked off resonance by the break
      }
    }

    const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const burst = exploding.current ? Math.sin(Math.min(shatter.current, 1) * Math.PI) * 4 : 0;
    for (let i = 0; i < pos.count; i++) {
      const wobble = Math.sin(omega.current * t * 2 + base[i * 3] * 1.8 + base[i * 3 + 1]) * 0.12;
      const d = wobble * amplitude.current;
      arr[i * 3] = base[i * 3] + normals[i * 3] * d + random[i * 3] * burst;
      arr[i * 3 + 1] = base[i * 3 + 1] + normals[i * 3 + 1] * d + random[i * 3 + 1] * burst;
      arr[i * 3 + 2] = base[i * 3 + 2] + normals[i * 3 + 2] * d + random[i * 3 + 2] * burst;
    }
    pos.needsUpdate = true;

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.25;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.3;
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = exploding.current ? 0.9 : 0.45 + Math.min(amplitude.current * 0.12, 0.4);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial color={accent} wireframe transparent opacity={0.5} />
    </mesh>
  );
}

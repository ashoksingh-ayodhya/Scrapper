import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const COUNT = 1500;

/**
 * Theory 18 — the inverted interaction: tracking the cloud (moving the
 * pointer, scrolling) blurs and scatters it. Hold perfectly still and it
 * sharpens into a crisp formation.
 */
export default function ObserverEffect({ accent, ambient }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const observation = useRef(1);
  const lastPointer = useRef(new THREE.Vector2(9, 9));
  const { pointer } = useThree();

  // crisp formation: points on a sphere surface in latitude rings
  const home = useMemo(() => {
    const out = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      out[i * 3] = Math.sin(phi) * Math.cos(theta) * 3;
      out[i * 3 + 1] = Math.cos(phi) * 3;
      out[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 3;
    }
    return out;
  }, []);

  const positions = useMemo(() => home.slice(), [home]);
  const scatter = useMemo(() => {
    const out = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i++) out[i] = (Math.random() - 0.5) * 2;
    return out;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // observation = pointer movement + scroll measurement
    const moved = lastPointer.current.distanceTo(new THREE.Vector2(pointer.x, pointer.y));
    lastPointer.current.set(pointer.x, pointer.y);
    const disturbance = ambient
      ? 0.25
      : Math.min(moved * 30, 1) + Math.min(Math.abs(readVelocity()) * 0.02, 1);
    if (disturbance > 0.05) {
      observation.current = Math.min(1, observation.current + disturbance * dt * 6);
    } else {
      observation.current = Math.max(0, observation.current - dt * 0.55);
    }
    const o = observation.current;

    for (let i = 0; i < COUNT; i++) {
      const jitter = o * 1.6;
      const tx =
        home[i * 3] + scatter[i * 3] * jitter * Math.sin(t * 3.1 + i) + scatter[i * 3] * o;
      const ty =
        home[i * 3 + 1] +
        scatter[i * 3 + 1] * jitter * Math.cos(t * 2.7 + i * 1.3) +
        scatter[i * 3 + 1] * o;
      const tz = home[i * 3 + 2] + scatter[i * 3 + 2] * jitter * Math.sin(t * 2.2 + i * 0.7);
      positions[i * 3] += (tx - positions[i * 3]) * 0.12;
      positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * 0.12;
      positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * 0.12;
    }
    const attr = pointsRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;

    const mat = pointsRef.current?.material as THREE.PointsMaterial | undefined;
    if (mat) {
      mat.size = 0.05 + o * 0.06;
      mat.opacity = 0.9 - o * 0.45;
    }
    if (pointsRef.current) pointsRef.current.rotation.y = t * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={accent}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

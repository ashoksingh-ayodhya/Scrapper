import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const ADOPTERS = 460;
const P = 0.012; // innovation
const Q = 0.42; // imitation
const SPAN = 12; // world width of the timeline

/** Cumulative Bass adoption F(t) for t in [0,1] (closed form). */
function bassF(t: number): number {
  const T = t * 24;
  const e = Math.exp(-(P + Q) * T);
  return (1 - e) / (1 + (Q / P) * e);
}

/**
 * Theory 08 — the Bass diffusion S-curve. A time cursor sweeps the field;
 * gray prospects flip to accent as adoption reaches them. Pointer x scrubs.
 */
export default function BassDiffusion({ accent, ambient }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const cursorRef = useRef<THREE.Mesh>(null);
  const cursorT = useRef(0);
  const { pointer } = useThree();
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const grayColor = useMemo(() => new THREE.Color('#42465a'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // each adopter: adoption time (inverse-sampled from F), x position, y scatter
  const adopters = useMemo(() => {
    const time = new Float32Array(ADOPTERS);
    const positions = new Float32Array(ADOPTERS * 3);
    for (let i = 0; i < ADOPTERS; i++) {
      // inverse sample: find t where F(t) = u
      const u = (i + 0.5) / ADOPTERS;
      let lo = 0;
      let hi = 1;
      for (let s = 0; s < 22; s++) {
        const mid = (lo + hi) / 2;
        if (bassF(mid) < u) lo = mid;
        else hi = mid;
      }
      time[i] = lo;
      positions[i * 3] = (lo - 0.5) * SPAN + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = -3.4 + Math.random() * 2.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return { time, positions };
  }, []);

  const colors = useMemo(() => new Float32Array(ADOPTERS * 3).fill(0.3), []);

  const curveGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      pts.push(new THREE.Vector3((t - 0.5) * SPAN, -1 + bassF(t) * 5.4, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const curveLine = useMemo(
    () =>
      new THREE.Line(
        curveGeometry,
        new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.5 }),
      ),
    [curveGeometry, accent],
  );
  useEffect(
    () => () => {
      curveGeometry.dispose();
      curveLine.material.dispose();
    },
    [curveGeometry, curveLine],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const wind = readVelocity();
    if (!ambient && Math.abs(pointer.x) > 0.02) {
      // pointer scrubs the cursor
      cursorT.current += ((pointer.x + 1) / 2 - cursorT.current) * 0.08;
    } else {
      cursorT.current += dt * 0.08 + Math.min(Math.abs(wind) * 0.0006, 0.01);
      if (cursorT.current > 1.15) cursorT.current = 0;
    }

    for (let i = 0; i < ADOPTERS; i++) {
      const adopted = adopters.time[i] <= cursorT.current;
      tmpColor.fromArray(colors, i * 3);
      tmpColor.lerp(adopted ? accentColor : grayColor, 0.12);
      tmpColor.toArray(colors, i * 3);
    }
    const colorAttr = pointsRef.current?.geometry.getAttribute('color') as
      | THREE.BufferAttribute
      | undefined;
    if (colorAttr) colorAttr.needsUpdate = true;

    if (cursorRef.current) {
      cursorRef.current.position.x = (cursorT.current - 0.5) * SPAN;
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      <primitive object={curveLine} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[adopters.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.95} depthWrite={false} />
      </points>
      <mesh ref={cursorRef} position={[-SPAN / 2, 0.6, 0]}>
        <planeGeometry args={[0.025, 8.4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const COUNT = 240;
const BARRIER_FULL = 2.8;
const BARRIER_CATALYZED = 0.7;
const CURVE_N = 90;

function barrierY(x: number, h: number): number {
  return h * Math.exp(-(x * x) / 1.1) - 3.2;
}

/**
 * Theory 19 — particles trapped behind an energy barrier. Click and hold to
 * drop in the catalyst: the wall lowers and the reaction floods through.
 */
export default function ActivationEnergy({ accent, ambient }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const holding = useRef(false);
  const barrier = useRef(BARRIER_FULL);
  const { gl } = useThree();

  // x, vx, energy, crossed flag — particles bounce in the left well
  const sim = useMemo(() => {
    const data = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      data[i * 4] = -5.5 + Math.random() * 3.6;
      data[i * 4 + 1] = (Math.random() - 0.5) * 2;
      data[i * 4 + 2] = 0.4 + Math.random() * 2.2; // kinetic energy budget
      data[i * 4 + 3] = 0;
    }
    return data;
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3).fill(0.45), []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const dimColor = useMemo(() => new THREE.Color('#4a4e62'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const wall = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(CURVE_N * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: '#cfd4e8',
      transparent: true,
      opacity: 0.55,
    });
    return { geometry, material, line: new THREE.Line(geometry, material) };
  }, []);

  useEffect(
    () => () => {
      wall.geometry.dispose();
      wall.material.dispose();
    },
    [wall],
  );

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const down = () => (holding.current = true);
    const up = () => (holding.current = false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, ambient]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const heat = 1 + Math.min(Math.abs(readVelocity()) * 0.02, 1.2);

    barrier.current +=
      ((holding.current ? BARRIER_CATALYZED : BARRIER_FULL) - barrier.current) * 0.06;

    // redraw the barrier curve
    const wallAttr = wall.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < CURVE_N; i++) {
      const x = -7 + (i / (CURVE_N - 1)) * 14;
      wallAttr.setXYZ(i, x, barrierY(x, barrier.current), 0);
    }
    wallAttr.needsUpdate = true;
    wall.geometry.computeBoundingSphere();

    for (let i = 0; i < COUNT; i++) {
      let x = sim[i * 4];
      let vx = sim[i * 4 + 1];
      const energy = sim[i * 4 + 2] * heat;
      const crossed = sim[i * 4 + 3];

      vx += (Math.random() - 0.5) * 2.4 * dt * heat;
      x += vx * dt;

      // the barrier reflects particles whose energy can't clear it
      if (crossed < 0.5 && x > -1.1 && energy < barrier.current) {
        x = -1.1;
        vx = -Math.abs(vx) * 0.85;
      }
      if (x > 0.4) sim[i * 4 + 3] = 1; // over the hump — reacted
      // keep particles in frame; respawn reacted ones back into the well
      if (x < -6.4) {
        x = -6.4;
        vx = Math.abs(vx);
      }
      if (x > 6.6) {
        x = -5.5 + Math.random() * 2;
        vx = (Math.random() - 0.5) * 2;
        sim[i * 4 + 3] = 0;
      }
      sim[i * 4] = x;
      sim[i * 4 + 1] = vx;

      positions[i * 3] = x;
      positions[i * 3 + 1] =
        barrierY(x, sim[i * 4 + 3] > 0.5 ? 0 : barrier.current) +
        0.35 +
        Math.abs(Math.sin(t * 2.4 + i)) * (0.25 + energy * 0.22);
      positions[i * 3 + 2] = Math.sin(i) * 0.5;

      tmpColor.fromArray(colors, i * 3);
      tmpColor.lerp(sim[i * 4 + 3] > 0.5 ? accentColor : dimColor, 0.1);
      tmpColor.toArray(colors, i * 3);
    }
    const posAttr = pointsRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (posAttr) posAttr.needsUpdate = true;
    const colAttr = pointsRef.current?.geometry.getAttribute('color') as
      | THREE.BufferAttribute
      | undefined;
    if (colAttr) colAttr.needsUpdate = true;
  });

  return (
    <group position={[0, 1, 0]}>
      <primitive object={wall.line} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.11} vertexColors transparent opacity={0.95} depthWrite={false} />
      </points>
    </group>
  );
}

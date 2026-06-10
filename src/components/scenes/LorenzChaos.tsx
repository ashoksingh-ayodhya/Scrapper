import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';
import { TrailBuffer } from './lib/sceneUtils';

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const TRAIL = 1600;
const SCALE = 0.16;

/**
 * Theory 03 — two Lorenz ribbons whose seeds differ by 1e-4. Scroll velocity
 * scales the integration step and adds noise, visibly tearing the ribbons.
 */
export default function LorenzChaos({ accent, ambient }: SceneProps) {
  const stateA = useRef({ x: 0.1, y: 0, z: 0 });
  const stateB = useRef({ x: 0.1001, y: 0, z: 0 });
  const groupRef = useRef<THREE.Group>(null);

  const { trailA, trailB, lineA, lineB, geoA, geoB, matA, matB } = useMemo(() => {
    const tA = new TrailBuffer(TRAIL);
    const tB = new TrailBuffer(TRAIL);
    const gA = new THREE.BufferGeometry();
    const gB = new THREE.BufferGeometry();
    tA.writeTo(gA);
    tB.writeTo(gB);
    const mA = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 });
    const mB = new THREE.LineBasicMaterial({ color: '#8b8fa3', transparent: true, opacity: 0.55 });
    return {
      trailA: tA,
      trailB: tB,
      geoA: gA,
      geoB: gB,
      matA: mA,
      matB: mB,
      lineA: new THREE.Line(gA, mA),
      lineB: new THREE.Line(gB, mB),
    };
  }, [accent]);

  useEffect(
    () => () => {
      geoA.dispose();
      geoB.dispose();
      matA.dispose();
      matB.dispose();
    },
    [geoA, geoB, matA, matB],
  );

  useFrame((frameState, delta) => {
    const wind = Math.abs(readVelocity());
    const steps = ambient ? 4 : 6;
    const dt = Math.min(delta, 0.04) * (0.45 + Math.min(wind * 0.02, 0.9));
    const noise = Math.min(wind * 0.004, 0.35);

    for (let s = 0; s < steps; s++) {
      for (const st of [stateA.current, stateB.current]) {
        const dx = SIGMA * (st.y - st.x);
        const dy = st.x * (RHO - st.z) - st.y;
        const dz = st.x * st.y - BETA * st.z;
        st.x += dx * dt * 0.25;
        st.y += dy * dt * 0.25;
        st.z += dz * dt * 0.25;
      }
      const a = stateA.current;
      const b = stateB.current;
      trailA.push(
        a.x * SCALE + (Math.random() - 0.5) * noise,
        (a.z - RHO) * SCALE + (Math.random() - 0.5) * noise,
        a.y * SCALE * 0.6,
      );
      trailB.push(
        b.x * SCALE + (Math.random() - 0.5) * noise,
        (b.z - RHO) * SCALE + (Math.random() - 0.5) * noise,
        b.y * SCALE * 0.6,
      );
    }
    geoA.setDrawRange(0, trailA.drawCount);
    geoB.setDrawRange(0, trailB.drawCount);
    geoA.computeBoundingSphere();
    geoB.computeBoundingSphere();

    if (groupRef.current) {
      groupRef.current.rotation.y = frameState.clock.elapsedTime * 0.12;
    }
  });

  return (
    <group ref={groupRef} scale={1.15}>
      <primitive object={lineA} />
      <primitive object={lineB} />
    </group>
  );
}

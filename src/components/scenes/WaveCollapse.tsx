import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';
import { randGauss } from './lib/sceneUtils';

const COUNT = 1600;

type Phase = 'cloud' | 'collapse' | 'hold' | 'diffuse';

/**
 * Theory 05 — a probability cloud of one undecided buyer. The observation
 * line follows the pointer; click to force the measurement and collapse the
 * wave with a flash.
 */
export default function WaveCollapse({ accent, ambient }: SceneProps) {
  const n = ambient ? 700 : COUNT;
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const phase = useRef<Phase>('cloud');
  const phaseT = useRef(0);
  const collapsePoint = useRef(new THREE.Vector3());
  const { gl, pointer, viewport } = useThree();

  const home = useMemo(() => randGauss(n, 1.6), [n]);
  const positions = useMemo(() => home.slice(), [home]);

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const click = () => {
      if (phase.current !== 'cloud') return;
      phase.current = 'collapse';
      phaseT.current = 0;
      collapsePoint.current.set((pointer.x * viewport.width) / 2, 0, 0);
    };
    el.addEventListener('pointerdown', click);
    return () => el.removeEventListener('pointerdown', click);
  }, [gl, ambient, pointer, viewport]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    phaseT.current += dt;
    const t = state.clock.elapsedTime;
    const wind = Math.abs(readVelocity());
    const spread = 1 + Math.min(wind * 0.01, 0.8); // uncertainty widens on scroll

    if (phase.current === 'collapse' && phaseT.current > 0.45) {
      phase.current = 'hold';
      phaseT.current = 0;
    } else if (phase.current === 'hold' && phaseT.current > 1) {
      phase.current = 'diffuse';
      phaseT.current = 0;
    } else if (phase.current === 'diffuse' && phaseT.current > 1.2) {
      phase.current = 'cloud';
      phaseT.current = 0;
    }

    for (let i = 0; i < n; i++) {
      const hx = home[i * 3] * spread;
      const hy = home[i * 3 + 1] * spread;
      const hz = home[i * 3 + 2] * spread;
      const breathe = Math.sin(t * 1.4 + i * 0.3) * 0.08;
      if (phase.current === 'collapse' || phase.current === 'hold') {
        const k = phase.current === 'hold' ? 0.45 : 0.18;
        positions[i * 3] += (collapsePoint.current.x - positions[i * 3]) * k;
        positions[i * 3 + 1] += (collapsePoint.current.y - positions[i * 3 + 1]) * k;
        positions[i * 3 + 2] += (collapsePoint.current.z - positions[i * 3 + 2]) * k;
      } else {
        const k = phase.current === 'diffuse' ? 0.05 : 0.025;
        positions[i * 3] += (hx + breathe - positions[i * 3]) * k;
        positions[i * 3 + 1] += (hy + breathe - positions[i * 3 + 1]) * k;
        positions[i * 3 + 2] += (hz - positions[i * 3 + 2]) * k;
      }
    }
    const attr = pointsRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;

    // observation line tracks pointer x
    if (lineRef.current && !ambient) {
      const targetX = (pointer.x * viewport.width) / 2;
      lineRef.current.position.x += (targetX - lineRef.current.position.x) * 0.1;
    }
    // measurement flash
    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      if (phase.current === 'hold' && phaseT.current < 0.4) {
        flashRef.current.position.copy(collapsePoint.current);
        const s = 0.4 + phaseT.current * 5;
        flashRef.current.scale.setScalar(s);
        mat.opacity = 0.9 * (1 - phaseT.current / 0.4);
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color={accent}
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh ref={lineRef}>
        <planeGeometry args={[0.03, 9]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh ref={flashRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

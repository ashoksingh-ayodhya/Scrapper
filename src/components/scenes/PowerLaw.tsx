import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const BARS = 110;
const SPAN = 12.5;
const HEAD = 5;

/**
 * Theory 11 — a power-law bar field: five bright head accounts, a long dim
 * tail. Pointer x retunes the exponent α; scroll velocity makes the bars hum.
 */
export default function PowerLaw({ accent, ambient }: SceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const alpha = useRef(1.0);
  const { pointer } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const tailColor = useMemo(() => new THREE.Color('#2c2f40'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      mesh?.geometry.dispose();
      (mesh?.material as THREE.Material | undefined)?.dispose();
    };
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const wind = Math.abs(readVelocity());

    if (!ambient) {
      const targetAlpha = THREE.MathUtils.mapLinear(pointer.x, -1, 1, 0.55, 1.7);
      alpha.current += (targetAlpha - alpha.current) * 0.06;
    }

    const w = SPAN / BARS;
    for (let i = 0; i < BARS; i++) {
      const h = 7.5 * Math.pow(i + 1, -alpha.current);
      const hum = Math.sin(t * 3 + i * 0.4) * Math.min(wind * 0.004, 0.2);
      const height = Math.max(h + hum, 0.04);
      dummy.position.set(-SPAN / 2 + i * w + w / 2, height / 2 - 3.4, 0);
      dummy.scale.set(w * 0.62, height, 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (i < HEAD) {
        tmpColor.copy(accentColor);
        tmpColor.offsetHSL(0, 0, Math.sin(t * 2 + i) * 0.06);
      } else {
        const fade = 1 - Math.min((i - HEAD) / (BARS * 0.6), 1);
        tmpColor.copy(tailColor).lerp(accentColor, fade * 0.25);
      }
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BARS]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

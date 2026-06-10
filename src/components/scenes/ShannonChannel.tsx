import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const SIGNAL = 220;
const NOISE = 420;
const PIPE_LEN = 12;
const PIPE_R = 1.6;

/**
 * Theory 12 — signal particles streaming through a channel while pointer-
 * controlled noise floods it. Past capacity, the signal scatters and grays.
 */
export default function ShannonChannel({ accent, ambient }: SceneProps) {
  const signalRef = useRef<THREE.Points>(null);
  const noiseRef = useRef<THREE.Points>(null);
  const noiseLevel = useRef(0.25);
  const textRef = useRef<{ text: string }>(null);
  const { pointer } = useThree();

  const signal = useMemo(() => {
    const pos = new Float32Array(SIGNAL * 3);
    const seed = new Float32Array(SIGNAL * 2); // phase, radius
    for (let i = 0; i < SIGNAL; i++) {
      pos[i * 3] = (Math.random() - 0.5) * PIPE_LEN;
      seed[i * 2] = Math.random() * Math.PI * 2;
      seed[i * 2 + 1] = Math.random() * 0.4;
      pos[i * 3 + 1] = Math.sin(seed[i * 2]) * seed[i * 2 + 1];
      pos[i * 3 + 2] = Math.cos(seed[i * 2]) * seed[i * 2 + 1];
    }
    return { pos, seed };
  }, []);

  const noise = useMemo(() => {
    const pos = new Float32Array(NOISE * 3);
    for (let i = 0; i < NOISE; i++) {
      pos[i * 3] = (Math.random() - 0.5) * PIPE_LEN;
      pos[i * 3 + 1] = (Math.random() - 0.5) * PIPE_R * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * PIPE_R * 2;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const wind = Math.abs(readVelocity());

    const target = ambient
      ? 0.3
      : THREE.MathUtils.clamp((pointer.y + 1) / 2, 0, 1) + Math.min(wind * 0.01, 0.4);
    noiseLevel.current += (target - noiseLevel.current) * 0.05;
    const overflow = THREE.MathUtils.smoothstep(noiseLevel.current, 0.55, 1.0);

    // signal flows left -> right; scatter grows with overflow
    for (let i = 0; i < SIGNAL; i++) {
      signal.pos[i * 3] += dt * (2.6 - overflow * 1.4);
      if (signal.pos[i * 3] > PIPE_LEN / 2) signal.pos[i * 3] = -PIPE_LEN / 2;
      const phase = signal.seed[i * 2] + t * 2;
      const r = signal.seed[i * 2 + 1] + overflow * (0.5 + Math.sin(i * 7.3) * 0.45);
      signal.pos[i * 3 + 1] = Math.sin(phase) * r;
      signal.pos[i * 3 + 2] = Math.cos(phase) * r;
    }
    const sAttr = signalRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (sAttr) sAttr.needsUpdate = true;
    const sMat = signalRef.current?.material as THREE.PointsMaterial | undefined;
    if (sMat) sMat.color.lerp(new THREE.Color(overflow > 0.6 ? '#5a5e72' : accent), 0.06);

    // noise jitters; its visible amount tracks the level
    const visible = Math.floor(NOISE * noiseLevel.current);
    for (let i = 0; i < NOISE; i++) {
      if (i < visible) {
        noise[i * 3] += (Math.random() - 0.5) * 0.12;
        noise[i * 3 + 1] += (Math.random() - 0.5) * 0.12;
        noise[i * 3 + 2] += (Math.random() - 0.5) * 0.12;
        if (Math.abs(noise[i * 3]) > PIPE_LEN / 2) noise[i * 3] *= 0.9;
        if (Math.abs(noise[i * 3 + 1]) > PIPE_R) noise[i * 3 + 1] *= 0.9;
        if (Math.abs(noise[i * 3 + 2]) > PIPE_R) noise[i * 3 + 2] *= 0.9;
      }
    }
    const nAttr = noiseRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (nAttr) nAttr.needsUpdate = true;
    if (noiseRef.current) noiseRef.current.geometry.setDrawRange(0, visible);

    if (textRef.current) {
      const snr = (1 - noiseLevel.current + 0.05) / (noiseLevel.current + 0.05);
      textRef.current.text = `C = B·log₂(1 + S/N) = ${Math.log2(1 + snr).toFixed(2)}B`;
    }
  });

  return (
    <group rotation-z={0}>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[PIPE_R, PIPE_R, PIPE_LEN, 14, 6, true]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.08} />
      </mesh>
      <points ref={signalRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[signal.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} color={accent} transparent opacity={0.95} depthWrite={false} />
      </points>
      <points ref={noiseRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[noise, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#5a4a4a" transparent opacity={0.5} depthWrite={false} />
      </points>
      <Text
        ref={textRef}
        font="/fonts/jetbrains-mono-400.woff"
        fontSize={0.38}
        color={accent}
        anchorX="center"
        position={[0, -3.4, 0]}
      >
        C = B·log₂(1 + S/N)
      </Text>
    </group>
  );
}

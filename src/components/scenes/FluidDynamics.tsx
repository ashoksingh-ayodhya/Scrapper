import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MONO_FONT_URL } from '@/lib/assets';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const COUNT = 420;
const LEN = 13;
const WALL_N = 80;

/**
 * Theory 20 — Bernoulli's pipe. Particles speed up through the constriction
 * (continuity) and the pressure readout drops. Pointer y narrows the pipe.
 */
export default function FluidDynamics({ accent, ambient }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const constrict = useRef(0.8);
  const textRef = useRef<{ text: string }>(null);
  const { pointer } = useThree();
  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);
  const slowColor = useMemo(() => new THREE.Color('#4a4e62'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const halfWidth = (x: number) =>
    2.1 - constrict.current * Math.exp(-(x * x) / 2.4);

  // per particle: x progress, lane (-1..1), z
  const sim = useMemo(() => {
    const data = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      data[i * 3] = -LEN / 2 + Math.random() * LEN;
      data[i * 3 + 1] = Math.random() * 2 - 1;
      data[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
    }
    return data;
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3).fill(0.4), []);

  const walls = useMemo(() => {
    const make = () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(WALL_N * 3), 3),
      );
      const material = new THREE.LineBasicMaterial({
        color: '#cfd4e8',
        transparent: true,
        opacity: 0.5,
      });
      return { geometry, material, line: new THREE.Line(geometry, material) };
    };
    return { top: make(), bottom: make() };
  }, []);

  useEffect(
    () => () => {
      walls.top.geometry.dispose();
      walls.top.material.dispose();
      walls.bottom.geometry.dispose();
      walls.bottom.material.dispose();
    },
    [walls],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const inflow = 1 + Math.min(Math.abs(readVelocity()) * 0.015, 1);

    if (!ambient) {
      const target = THREE.MathUtils.mapLinear(Math.abs(pointer.y), 0, 1, 0.55, 1.75);
      constrict.current += (target - constrict.current) * 0.06;
    }

    // redraw walls
    for (const [wall, sign] of [
      [walls.top, 1],
      [walls.bottom, -1],
    ] as const) {
      const attr = wall.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < WALL_N; i++) {
        const x = -LEN / 2 + (i / (WALL_N - 1)) * LEN;
        attr.setXYZ(i, x, sign * halfWidth(x), 0);
      }
      attr.needsUpdate = true;
      wall.geometry.computeBoundingSphere();
    }

    let throatSpeed = 0;
    for (let i = 0; i < COUNT; i++) {
      const w = halfWidth(sim[i * 3]);
      // continuity: A·v constant, narrower pipe = faster flow
      const speed = (2.4 * 2.1) / w;
      sim[i * 3] += speed * dt * inflow;
      if (sim[i * 3] > LEN / 2) {
        sim[i * 3] = -LEN / 2;
        sim[i * 3 + 1] = Math.random() * 2 - 1;
      }
      if (Math.abs(sim[i * 3]) < 0.4) throatSpeed = Math.max(throatSpeed, speed);

      positions[i * 3] = sim[i * 3];
      positions[i * 3 + 1] = sim[i * 3 + 1] * w * 0.88;
      positions[i * 3 + 2] = sim[i * 3 + 2];

      const heatT = THREE.MathUtils.clamp((speed - 2.4) / 4.5, 0, 1);
      tmpColor.fromArray(colors, i * 3);
      tmpColor.lerp(slowColor.clone().lerp(accentColor, heatT), 0.2);
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

    if (textRef.current) {
      const v = (2.4 * 2.1) / halfWidth(0);
      const pressure = Math.max(0, 10 - 0.5 * v * v).toFixed(1);
      textRef.current.text = `v = ${v.toFixed(1)} · P = ${pressure}`;
    }
  });

  return (
    <group>
      <primitive object={walls.top.line} />
      <primitive object={walls.bottom.line} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} vertexColors transparent opacity={0.95} depthWrite={false} />
      </points>
      <Text
        ref={textRef}
        font={MONO_FONT_URL}
        fontSize={0.38}
        color={accent}
        anchorX="center"
        position={[0, -3.6, 0]}
      >
        P + ½ρv² = constant
      </Text>
    </group>
  );
}

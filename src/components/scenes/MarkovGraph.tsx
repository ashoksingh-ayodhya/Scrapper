import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const NODES: [number, number, number][] = [
  [-5.5, 2.4, 0], // SMS
  [-5.5, -0.2, 0], // Field
  [-5.5, -2.8, 0], // Radio
  [-1.8, 1.6, 0], // WhatsApp
  [-1.8, -1.8, 0], // Search
  [1.8, 0, 0], // Meta
  [4.8, 1.6, 0], // Signup
  [4.8, -1.8, 0], // Churn
];

const EDGES: [number, number][] = [
  [0, 3],
  [0, 4],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [3, 6],
  [5, 6],
  [5, 7],
  [4, 7],
];

const PARTICLES = 140;

/**
 * Theory 02 — channels as nodes, traffic as light. Click a node to dim it
 * and the network's conversion probability recomputes live.
 */
export default function MarkovGraph({ accent, ambient }: SceneProps) {
  const [disabled, setDisabled] = useState<Set<number>>(new Set());
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);

  const activeEdges = useMemo(
    () => EDGES.map((_, i) => i).filter((i) => !disabled.has(EDGES[i][0]) && !disabled.has(EDGES[i][1])),
    [disabled],
  );

  const probability = useMemo(() => {
    const ratio = activeEdges.length / EDGES.length;
    return (0.87 * Math.pow(ratio, 1.6)).toFixed(2);
  }, [activeEdges]);

  // particle state: edge index, t along the edge, speed
  const flow = useMemo(() => {
    const f = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      f[i * 3] = Math.floor(Math.random() * EDGES.length);
      f[i * 3 + 1] = Math.random();
      f[i * 3 + 2] = 0.25 + Math.random() * 0.6;
    }
    return f;
  }, []);

  const positions = useMemo(() => new Float32Array(PARTICLES * 3), []);

  const edgeGeometry = useMemo(() => {
    const pts: number[] = [];
    for (const [a, b] of EDGES) pts.push(...NODES[a], ...NODES[b]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const wind = Math.abs(readVelocity());
    for (let i = 0; i < PARTICLES; i++) {
      let edge = flow[i * 3];
      let t = flow[i * 3 + 1] + dt * flow[i * 3 + 2];
      if (t >= 1 || !activeEdges.includes(edge)) {
        edge = activeEdges.length
          ? activeEdges[Math.floor(Math.random() * activeEdges.length)]
          : 0;
        t = 0;
      }
      flow[i * 3] = edge;
      flow[i * 3 + 1] = t;
      const [a, b] = EDGES[edge];
      const hidden = activeEdges.length === 0;
      positions[i * 3] = THREE.MathUtils.lerp(NODES[a][0], NODES[b][0], t);
      positions[i * 3 + 1] = THREE.MathUtils.lerp(NODES[a][1], NODES[b][1], t) + (hidden ? 999 : 0);
      positions[i * 3 + 2] = Math.sin(t * Math.PI) * 0.4;
    }
    const attr = pointsRef.current?.geometry.getAttribute('position') as
      | THREE.BufferAttribute
      | undefined;
    if (attr) attr.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.02 + wind * 0.0008;
    }
  });

  const toggle = (i: number) => {
    if (ambient || i >= 6) return; // outcome nodes stay fixed
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={accent} transparent opacity={0.18} />
      </lineSegments>
      {NODES.map((p, i) => (
        <mesh key={i} position={p} onPointerDown={() => toggle(i)}>
          <sphereGeometry args={[i === 5 ? 0.42 : 0.28, 20, 20]} />
          <meshBasicMaterial
            color={disabled.has(i) ? '#333344' : accent}
            transparent
            opacity={disabled.has(i) ? 0.35 : 0.95}
          />
        </mesh>
      ))}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </points>
      <Text
        font="/fonts/jetbrains-mono-400.woff"
        fontSize={0.5}
        color={accent}
        anchorX="center"
        position={[0, 3.6, 0]}
      >
        {`P(c) = ${probability}`}
      </Text>
    </group>
  );
}

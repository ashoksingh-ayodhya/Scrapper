import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MONO_FONT_URL } from '@/lib/assets';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const MAX_NODES = 16;
const MAX_EDGES = (MAX_NODES * (MAX_NODES - 1)) / 2;
const RADIUS = 3.6;

/**
 * Theory 09 — Metcalfe's law. Nodes join a slowly rotating ring and every
 * join wires n-1 new edges; value grows with n(n-1)/2. Click to add a node.
 */
export default function MetcalfeMesh({ accent, ambient }: SceneProps) {
  const [nodeCount, setNodeCount] = useState(3);
  const groupRef = useRef<THREE.Group>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const growTimer = useRef(0);
  const { gl } = useThree();

  const nodePositions = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < MAX_NODES; i++) {
      const a = (i / MAX_NODES) * Math.PI * 2;
      out.push(
        new THREE.Vector3(
          Math.cos(a) * RADIUS,
          Math.sin(a) * RADIUS * 0.85,
          Math.sin(a * 2) * 0.6,
        ),
      );
    }
    return out;
  }, []);

  const edgePositions = useMemo(() => new Float32Array(MAX_EDGES * 6), []);

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const click = () => setNodeCount((n) => (n >= MAX_NODES ? 3 : n + 1));
    el.addEventListener('pointerdown', click);
    return () => el.removeEventListener('pointerdown', click);
  }, [gl, ambient]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const wind = Math.abs(readVelocity());

    // auto-grow the network
    growTimer.current += dt;
    if (growTimer.current > 2.2) {
      growTimer.current = 0;
      setNodeCount((n) => (n >= MAX_NODES ? 3 : n + 1));
    }

    // rebuild visible edges with a velocity-stretch wobble
    let e = 0;
    const stretch = 1 + Math.min(wind * 0.003, 0.25);
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const a = nodePositions[i];
        const b = nodePositions[j];
        edgePositions[e * 6] = a.x * stretch;
        edgePositions[e * 6 + 1] = a.y;
        edgePositions[e * 6 + 2] = a.z;
        edgePositions[e * 6 + 3] = b.x * stretch;
        edgePositions[e * 6 + 4] = b.y;
        edgePositions[e * 6 + 5] = b.z;
        e++;
      }
    }
    if (edgeRef.current) {
      const attr = edgeRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      edgeRef.current.geometry.setDrawRange(0, e * 2);
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.18;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
    }
  });

  const value = (nodeCount * (nodeCount - 1)) / 2;

  return (
    <group>
      <group ref={groupRef}>
        <lineSegments ref={edgeRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={accent} transparent opacity={0.3} />
        </lineSegments>
        {nodePositions.slice(0, nodeCount).map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i === nodeCount - 1 ? 0.22 : 0.14, 16, 16]} />
            <meshBasicMaterial color={i === nodeCount - 1 ? '#ffffff' : accent} />
          </mesh>
        ))}
      </group>
      <Text
        font={MONO_FONT_URL}
        fontSize={0.42}
        color={accent}
        anchorX="center"
        position={[0, -4.4, 0]}
      >
        {`n = ${nodeCount} · V ∝ ${value}`}
      </Text>
    </group>
  );
}

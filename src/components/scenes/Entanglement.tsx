import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';
import { randSphere } from './lib/sceneUtils';

const CLUSTER = 130;
const THREAD_PTS = 48;
const LEFT = new THREE.Vector3(-3.8, 0, 0);
const RIGHT = new THREE.Vector3(3.8, 0, 0);

/**
 * Theory 17 — two entangled buyer clusters joined by a glowing thread.
 * Click either cluster: its spin flips and the partner flips the same frame,
 * with a pulse racing down the thread.
 */
export default function Entanglement({ accent, ambient }: SceneProps) {
  const [spin, setSpin] = useState(1); // +1 up / -1 down, always anti-correlated
  const pulse = useRef(-1); // 0..1 = traveling along the thread
  const pulseRef = useRef<THREE.Mesh>(null);
  const leftPoints = useRef<THREE.Points>(null);
  const rightPoints = useRef<THREE.Points>(null);
  const coneL = useRef<THREE.Mesh>(null);
  const coneR = useRef<THREE.Mesh>(null);

  const home = useMemo(() => randSphere(CLUSTER, 1.5), []);
  const leftArr = useMemo(() => home.slice(), [home]);
  const rightArr = useMemo(() => home.slice(), [home]);

  const thread = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(THREAD_PTS * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.6,
    });
    return { geometry, material, line: new THREE.Line(geometry, material) };
  }, [accent]);

  useEffect(
    () => () => {
      thread.geometry.dispose();
      thread.material.dispose();
    },
    [thread],
  );

  const flip = () => {
    if (ambient) return;
    setSpin((s) => -s);
    pulse.current = 0;
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const sway = Math.min(Math.abs(readVelocity()) * 0.01, 1.2);

    // mirrored idle motion — non-local correlation
    for (let i = 0; i < CLUSTER; i++) {
      const wob = Math.sin(t * 1.6 + i * 0.7) * 0.09;
      leftArr[i * 3] = home[i * 3] + wob;
      leftArr[i * 3 + 1] = home[i * 3 + 1] + Math.cos(t * 1.3 + i) * 0.09;
      leftArr[i * 3 + 2] = home[i * 3 + 2];
      rightArr[i * 3] = home[i * 3] - wob; // mirror
      rightArr[i * 3 + 1] = home[i * 3 + 1] + Math.cos(t * 1.3 + i) * 0.09;
      rightArr[i * 3 + 2] = home[i * 3 + 2];
    }
    for (const ref of [leftPoints, rightPoints]) {
      const attr = ref.current?.geometry.getAttribute('position') as
        | THREE.BufferAttribute
        | undefined;
      if (attr) attr.needsUpdate = true;
    }

    // the thread sways like a plucked string; scroll stretches it
    const attr = thread.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < THREAD_PTS; i++) {
      const u = i / (THREAD_PTS - 1);
      const x = THREE.MathUtils.lerp(LEFT.x, RIGHT.x, u);
      const arc = Math.sin(u * Math.PI);
      const y = arc * (Math.sin(t * 1.1) * 0.6 + sway * Math.sin(t * 6 + u * 9) * 0.5);
      attr.setXYZ(i, x, y, arc * Math.cos(t * 0.9) * 0.4);
    }
    attr.needsUpdate = true;
    thread.geometry.computeBoundingSphere();

    // entanglement pulse travels the thread on flip
    if (pulse.current >= 0 && pulseRef.current) {
      pulse.current += dt * 2.4;
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      if (pulse.current >= 1) {
        pulse.current = -1;
        mat.opacity = 0;
      } else {
        const u = pulse.current;
        const x = THREE.MathUtils.lerp(LEFT.x, RIGHT.x, u);
        const arc = Math.sin(u * Math.PI);
        pulseRef.current.position.set(x, arc * Math.sin(t * 1.1) * 0.6, 0);
        mat.opacity = 1;
      }
    }

    // spin cones ease toward their (anti-correlated) orientations
    if (coneL.current && coneR.current) {
      const goalL = spin === 1 ? 0 : Math.PI;
      const goalR = spin === 1 ? Math.PI : 0;
      coneL.current.rotation.z += (goalL - coneL.current.rotation.z) * 0.15;
      coneR.current.rotation.z += (goalR - coneR.current.rotation.z) * 0.15;
    }
  });

  const cluster = (
    arr: Float32Array,
    ref: React.RefObject<THREE.Points | null>,
    pos: THREE.Vector3,
  ) => (
    <group position={pos}>
      <points ref={ref} onPointerDown={flip}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[arr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color={accent}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      {/* invisible hit target so clicking the cluster is easy */}
      <mesh onPointerDown={flip} visible={false}>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );

  return (
    <group>
      {cluster(leftArr, leftPoints, LEFT)}
      {cluster(rightArr, rightPoints, RIGHT)}
      <mesh ref={coneL} position={[LEFT.x, 2.4, 0]}>
        <coneGeometry args={[0.22, 0.6, 14]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={coneR} position={[RIGHT.x, 2.4, 0]} rotation-z={Math.PI}>
        <coneGeometry args={[0.22, 0.6, 14]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <primitive object={thread.line} />
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
    </group>
  );
}

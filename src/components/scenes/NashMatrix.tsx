import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const CELL = 2.6;
const LABELS = ['HOLD / HOLD', 'HOLD / CUT', 'CUT / HOLD', 'CUT / CUT'];

function cellCenter(row: number, col: number): [number, number, number] {
  return [(col - 0.5) * CELL, (0.5 - row) * CELL, 0];
}

/**
 * Theory 10 — best-response dynamics on a 2x2 pricing game. Both tokens hop
 * until they lock into the Nash cell (which pulses red). Click to perturb the
 * payoffs and replay the convergence.
 */
export default function NashMatrix({ accent, ambient }: SceneProps) {
  const tokenA = useRef<THREE.Mesh>(null);
  const tokenB = useRef<THREE.Mesh>(null);
  const nashGlow = useRef<THREE.Mesh>(null);
  const stepTimer = useRef(0);
  const game = useRef({
    // payoffs[row][col] = [u1, u2]; "cut price" dominates by default
    payoffs: [
      [
        [3, 3],
        [0, 4],
      ],
      [
        [4, 0],
        [1, 1],
      ],
    ] as number[][][],
    row: 0,
    col: 0,
    turn: 0,
  });
  const { gl } = useThree();

  const perturb = useMemo(
    () => () => {
      const g = game.current;
      g.payoffs = [
        [
          [2 + Math.random() * 3, 2 + Math.random() * 3],
          [Math.random() * 2, 3 + Math.random() * 2],
        ],
        [
          [3 + Math.random() * 2, Math.random() * 2],
          [0.5 + Math.random() * 2, 0.5 + Math.random() * 2],
        ],
      ];
      g.row = Math.round(Math.random());
      g.col = Math.round(Math.random());
    },
    [],
  );

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    el.addEventListener('pointerdown', perturb);
    return () => el.removeEventListener('pointerdown', perturb);
  }, [gl, ambient, perturb]);

  const findNash = () => {
    const p = game.current.payoffs;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const rowBest = p[r][c][0] >= p[1 - r][c][0];
        const colBest = p[r][c][1] >= p[r][1 - c][1];
        if (rowBest && colBest) return { r, c };
      }
    }
    return { r: 1, c: 1 };
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = game.current;
    const wind = Math.abs(readVelocity());

    stepTimer.current += dt;
    if (stepTimer.current > 0.9) {
      stepTimer.current = 0;
      // alternate best responses
      if (g.turn === 0) {
        g.row = g.payoffs[0][g.col][0] >= g.payoffs[1][g.col][0] ? 0 : 1;
      } else {
        g.col = g.payoffs[g.row][0][1] >= g.payoffs[g.row][1][1] ? 0 : 1;
      }
      g.turn = 1 - g.turn;
    }

    const target = new THREE.Vector3(...cellCenter(g.row, g.col));
    const shake = wind * 0.0015;
    if (tokenA.current) {
      tokenA.current.position.lerp(
        target.clone().add(new THREE.Vector3(-0.45 + (Math.random() - 0.5) * shake, 0.1, 0.5)),
        0.08,
      );
    }
    if (tokenB.current) {
      tokenB.current.position.lerp(
        target.clone().add(new THREE.Vector3(0.45 + (Math.random() - 0.5) * shake, -0.1, 0.5)),
        0.08,
      );
    }

    const nash = findNash();
    if (nashGlow.current) {
      nashGlow.current.position.set(...cellCenter(nash.r, nash.c));
      nashGlow.current.position.z = -0.1;
      const locked = g.row === nash.r && g.col === nash.c;
      const mat = nashGlow.current.material as THREE.MeshBasicMaterial;
      const pulse = locked ? 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.15 : 0.08;
      mat.opacity += (pulse - mat.opacity) * 0.1;
    }
  });

  return (
    <group>
      {([0, 1, 2, 3] as const).map((i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        return (
          <group key={i} position={cellCenter(row, col)}>
            <mesh>
              <boxGeometry args={[CELL * 0.92, CELL * 0.92, 0.12]} />
              <meshBasicMaterial color="#11131f" transparent opacity={0.85} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(CELL * 0.92, CELL * 0.92, 0.12)]} />
              <lineBasicMaterial color={accent} transparent opacity={0.35} />
            </lineSegments>
            <Text
              font="/fonts/jetbrains-mono-400.woff"
              fontSize={0.2}
              color="#8b8fa3"
              anchorX="center"
              position={[0, -CELL * 0.32, 0.1]}
            >
              {LABELS[i]}
            </Text>
          </group>
        );
      })}
      <mesh ref={nashGlow}>
        <planeGeometry args={[CELL * 0.98, CELL * 0.98]} />
        <meshBasicMaterial color="#ff3344" transparent opacity={0.08} />
      </mesh>
      <mesh ref={tokenA} position={cellCenter(0, 0)}>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh ref={tokenB} position={cellCenter(1, 1)}>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

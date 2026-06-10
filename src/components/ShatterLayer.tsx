import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';

const FONT_URL = '/fonts/jetbrains-mono-400.woff';

interface Burst {
  key: number;
  text: string;
  rect: { left: number; top: number; width: number; height: number };
}

interface Shard {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
}

function ShatterScene({ burst }: { burst: Burst }) {
  const groupRef = useRef<Group>(null);
  const shards = useRef<Shard[]>([]);

  if (shards.current.length === 0) {
    const chars = burst.text.split('');
    const charW = burst.rect.width / Math.max(chars.length, 1);
    // DOM pixel coords -> centered orthographic world coords (1 unit = 1px)
    const ox = burst.rect.left - window.innerWidth / 2 + charW / 2;
    const oy = window.innerHeight / 2 - burst.rect.top - burst.rect.height / 2;
    shards.current = chars.map((char, i) => ({
      char,
      x: ox + i * charW,
      y: oy,
      vx: (Math.random() - 0.5) * 260,
      vy: 120 + Math.random() * 240,
      spin: (Math.random() - 0.5) * 8,
    }));
  }

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);
    group.children.forEach((child, i) => {
      const s = shards.current[i];
      if (!s) return;
      s.vy -= 900 * dt; // gravity
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      child.position.set(s.x, s.y, 0);
      child.rotation.z += s.spin * dt;
    });
  });

  return (
    <group ref={groupRef}>
      {shards.current.map((s, i) => (
        <Text
          key={i}
          font={FONT_URL}
          fontSize={Math.max(burst.rect.height * 0.8, 12)}
          color="#33ebff"
          anchorX="center"
          anchorY="middle"
          position={[s.x, s.y, 0]}
        >
          {s.char === ' ' ? '' : s.char}
        </Text>
      ))}
    </group>
  );
}

/**
 * Fullscreen overlay Canvas that exists only for the 3s shatter burst
 * triggered when the user highlights .font-mono formula text (see App.tsx).
 */
export default function ShatterLayer() {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    let counter = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const onShatter = (e: Event) => {
      const { text, rect } = (e as CustomEvent<{ text: string; rect: DOMRect }>).detail;
      setBurst({
        key: ++counter,
        text: text.slice(0, 40),
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      });
      clearTimeout(timeout);
      timeout = setTimeout(() => setBurst(null), 3000);
    };
    window.addEventListener('shatter-text', onShatter);
    return () => {
      window.removeEventListener('shatter-text', onShatter);
      clearTimeout(timeout);
    };
  }, []);

  if (!burst) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <Canvas
        key={burst.key}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 100] }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <ShatterScene burst={burst} />
      </Canvas>
    </div>
  );
}

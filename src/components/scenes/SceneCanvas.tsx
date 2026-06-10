import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useInView } from '@/hooks/useInView';
import { ACCENT_HEX, type Accent } from '@/lib/accents';
import { sceneRegistry } from './registry';

interface SceneCanvasProps {
  component: string;
  accent: Accent;
  /** Deep-dive background mode: lower dpr, no pointer events, always mounted. */
  ambient?: boolean;
}

/**
 * Lazy-mount wrapper (spec Part 4.1): the WebGL Canvas only exists while the
 * section intersects the viewport — offscreen canvases are unmounted entirely
 * so at most ~2 GL contexts are ever alive during the 20-theory scroll.
 */
export default function SceneCanvas({ component, accent, ambient = false }: SceneCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { rootMargin: '20% 0px', threshold: 0 });
  const Scene = sceneRegistry[component];
  const mounted = ambient || inView;

  return (
    <div ref={ref} className="absolute inset-0">
      {mounted && Scene && (
        <Canvas
          dpr={ambient ? 1 : [1, 1.75]}
          gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
          camera={{ position: [0, 0, 14], fov: 45 }}
          style={ambient ? { pointerEvents: 'none' } : undefined}
        >
          <Suspense fallback={null}>
            <Scene accent={ACCENT_HEX[accent]} ambient={ambient} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

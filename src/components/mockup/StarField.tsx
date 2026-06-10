import { useEffect, useMemo, useRef } from 'react';
import { usePhysicsStore } from '@/store/usePhysicsStore';

export default function StarField({ count = 140 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 4,
      })),
    [count],
  );

  // Velocity-cracking deformation: subscribe imperatively and write the
  // transform directly — a React re-render per scroll frame would be 60/s.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let settled = true;
    const unsubscribe = usePhysicsStore.subscribe((state) => {
      const v = state.scrollVelocity;
      const distortion = Math.min(Math.abs(v) * 0.1, 20); // cap the crack
      if (distortion > 0.05) {
        settled = false;
        el.style.transition = 'none';
        el.style.transform = `skewY(${distortion * 0.06 * Math.sign(v)}deg) scaleY(${1 + distortion * 0.004})`;
      } else if (!settled) {
        settled = true;
        el.style.transition = 'transform 0.5s ease-out';
        el.style.transform = 'skewY(0deg) scaleY(1)';
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute animate-twinkle rounded-full bg-foreground"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

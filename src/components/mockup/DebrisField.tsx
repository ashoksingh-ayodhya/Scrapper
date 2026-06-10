import { useEffect, useMemo, useRef } from 'react';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import { ACCENT_HEX, type Accent } from '@/lib/accents';

// One glyph per theory family — physics/math symbols that read as
// "interactive simulation debris" rather than decoration.
const GLYPHS = ['∇', 'Σ', 'λ', 'π', 'ψ', '∞', 'φ', 'Δ', '∂', 'ℏ', 'Ω', 'γ', '≈', 'μ', 'χ', 'ξ'];
const ACCENT_ORDER: Accent[] = ['plasma', 'solar', 'acid', 'magenta', 'violet', 'gold'];

/**
 * Falling/drifting glass glyphs (the "gif animation" layer from the spec).
 * Each chip is a self-contained CSS animation so there is zero React render
 * cost; scroll velocity is read imperatively and applied as a playback-rate
 * multiplier so the field visibly "matches" the TextSpringRig text physics.
 */
export default function DebrisField({ count = 16 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const accent = ACCENT_ORDER[i % ACCENT_ORDER.length];
        const size = 44 + Math.round(Math.random() * 56);
        return {
          id: i,
          glyph: GLYPHS[i % GLYPHS.length],
          accent,
          left: Math.round(Math.random() * 96),
          size,
          duration: 24 + Math.random() * 26,
          delay: -Math.random() * 50,
        };
      }),
    [count],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chips = Array.from(el.querySelectorAll<HTMLElement>('.debris-chip'));
    let rate = 1;
    const unsubscribe = usePhysicsStore.subscribe((state) => {
      const target = 1 + Math.min(Math.abs(state.scrollVelocity) * 0.18, 6);
      rate += (target - rate) * 0.15;
      for (const chip of chips) {
        for (const anim of chip.getAnimations()) {
          anim.playbackRate = rate;
        }
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {items.map((d) => (
        <div
          key={d.id}
          className="debris-chip glass-chip absolute top-0 flex items-center justify-center rounded-2xl font-display"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            fontSize: d.size * 0.46,
            color: ACCENT_HEX[d.accent],
            borderColor: `${ACCENT_HEX[d.accent]}55`,
            boxShadow: `0 0 ${Math.round(d.size * 0.9)}px -${Math.round(d.size * 0.3)}px ${ACCENT_HEX[d.accent]}99`,
            animation: `debris-drift ${d.duration}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        >
          {d.glyph}
        </div>
      ))}
    </div>
  );
}

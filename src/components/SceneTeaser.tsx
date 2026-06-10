import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Theory } from '@/data/theories';
import {
  ACCENT_BG_FAINT,
  ACCENT_BG_HOVER,
  ACCENT_BORDER,
  ACCENT_GLOW,
  ACCENT_HEX,
  ACCENT_RING,
  ACCENT_TEXT,
} from '@/lib/accents';
import { useInView } from '@/hooks/useInView';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import SceneCanvas from '@/components/scenes/SceneCanvas';

export default function SceneTeaser({
  data,
  reverse = false,
}: {
  data: Theory;
  reverse?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  useInView(sectionRef, {
    rootMargin: '-30% 0px',
    onEnter: () => usePhysicsStore.getState().setActiveTheory(data.id),
  });

  return (
    <section
      ref={sectionRef}
      className="relative grid min-h-screen snap-center scroll-mt-20 grid-cols-1 items-center gap-10 overflow-hidden px-6 py-24 md:grid-cols-12 md:px-12"
    >
      {/* Full-bleed live simulation — same size as the section, never smaller. */}
      <div className={`vignette absolute inset-0 ${ACCENT_RING[data.accent]}`}>
        <SceneCanvas component={data.visualComponent} accent={data.accent} />
        <div
          className={`pointer-events-none absolute inset-0 from-background via-background/35 to-transparent md:via-background/10 ${
            reverse ? 'bg-gradient-to-l' : 'bg-gradient-to-r'
          }`}
        />
      </div>

      {/* "This is alive" badge — sits over the open scene area. */}
      <div
        className={`glass-chip pointer-events-none absolute top-6 z-10 flex items-center gap-2 rounded-full px-3 py-1.5 ${
          reverse ? 'left-6 md:left-auto md:right-6' : 'right-6'
        }`}
      >
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ backgroundColor: ACCENT_HEX[data.accent], boxShadow: `0 0 8px ${ACCENT_HEX[data.accent]}` }}
        />
        <span className={`font-mono text-[9px] tracking-[0.3em] ${ACCENT_TEXT[data.accent]}`}>
          LIVE SIM · DRAG TO INTERACT
        </span>
      </div>

      <div
        className={`glass relative z-10 rounded-3xl p-8 md:col-span-5 md:p-10 ${ACCENT_GLOW[data.accent]} ${
          reverse ? 'md:order-2 md:col-start-8' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <p className={`font-mono text-[11px] tracking-[0.3em] ${ACCENT_TEXT[data.accent]}`}>
            THEORY · {data.index}
          </p>
          <span className="h-px w-8 bg-foreground/20" aria-hidden="true" />
          <p className="font-mono text-[10px] tracking-[0.3em] ink-faint">
            SCALE · {data.scale}
          </p>
        </div>
        <h2 className="mt-4 font-display text-balance text-4xl leading-[1.05] md:text-6xl">
          {data.title}
        </h2>
        <p className="mt-6 text-pretty text-base ink-muted md:text-lg">{data.copy}</p>
        <div className={`mb-6 mt-8 inline-block rounded border bg-background/40 px-3 py-2 ${ACCENT_BORDER[data.accent]}`}>
          <p className={`font-mono text-xs ${ACCENT_TEXT[data.accent]}`}>{data.formula}</p>
        </div>
        <div>
          <Link
            to={`/theory/${data.id}`}
            className={`inline-flex items-center gap-2 rounded border px-5 py-3 font-mono text-[11px] tracking-[0.3em] transition-colors ${ACCENT_BORDER[data.accent]} ${ACCENT_BG_FAINT[data.accent]} ${ACCENT_BG_HOVER[data.accent]} ${ACCENT_TEXT[data.accent]}`}
          >
            [ DEEP DIVE ] →
          </Link>
        </div>
      </div>
    </section>
  );
}

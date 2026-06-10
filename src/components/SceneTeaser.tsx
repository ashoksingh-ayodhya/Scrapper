import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Theory } from '@/data/theories';
import {
  ACCENT_BG_FAINT,
  ACCENT_BG_HOVER,
  ACCENT_BORDER,
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
      className="relative grid min-h-screen snap-center scroll-mt-20 grid-cols-1 items-center gap-10 px-6 py-24 md:grid-cols-12 md:px-12"
    >
      <div className={`md:col-span-5 ${reverse ? 'md:order-2 md:col-start-8' : ''}`}>
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
        <p className="mt-6 max-w-md text-pretty text-base ink-muted md:text-lg">{data.copy}</p>
        <div className="mb-6 mt-8 inline-block rounded border hairline bg-card/40 px-3 py-2 backdrop-blur-sm">
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
      <div
        className={`relative h-[60vh] md:col-span-7 md:h-[80vh] ${
          reverse ? 'md:order-1 md:col-start-1 md:row-start-1' : ''
        }`}
      >
        <div className="vignette absolute inset-0 border hairline bg-background/50">
          <SceneCanvas component={data.visualComponent} accent={data.accent} />
        </div>
      </div>
    </section>
  );
}

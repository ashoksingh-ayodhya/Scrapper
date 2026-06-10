import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import type Lenis from 'lenis';
import { AlertTriangle, Compass } from 'lucide-react';
import { theories } from '@/data/theories';
import { ACCENT_BORDER, ACCENT_GLOW, ACCENT_TEXT } from '@/lib/accents';
import SceneCanvas from '@/components/scenes/SceneCanvas';
import Reveal from '@/components/Reveal';
import ComicFrame from '@/components/ComicFrame';

export default function TheoryDeepDive() {
  const { id } = useParams();
  const theory = theories.find((t) => t.id === id);

  useEffect(() => {
    const lenis = (window as unknown as { lenis?: Lenis }).lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [id]);

  if (!theory) {
    return <div className="p-12 text-center font-mono">THEORY COLLAPSED. 404.</div>;
  }

  const currentIndex = theories.findIndex((t) => t.id === id);
  const nextTheory = theories[(currentIndex + 1) % theories.length];

  return (
    <main className="relative min-h-screen bg-background text-foreground selection:bg-plasma/30">
      {/* Background Ambience: the theory's live WebGL scene, large and visible
          behind the glass reading column — not just a dim blur. */}
      <div className="fixed inset-0 z-0 scale-105 blur-[2px] brightness-[0.55]">
        <SceneCanvas component={theory.visualComponent} accent={theory.accent} ambient />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/40 via-transparent to-background/70" />

      <nav className="fixed left-5 top-5 z-40">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.4em] text-plasma transition-colors hover:text-foreground"
        >
          ← BACK TO ORBIT
        </Link>
      </nav>

      {/* The Reading Column — a glass island floating over the live scene. */}
      <article className="glass relative z-10 mx-auto my-10 min-h-[calc(100vh-5rem)] max-w-3xl rounded-3xl px-6 py-20 md:px-12 md:py-28">
        <Reveal>
          <header className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <p className={`font-mono text-[11px] tracking-[0.3em] ${ACCENT_TEXT[theory.accent]}`}>
                THEORY · {theory.index}
              </p>
              <span className="h-px w-8 bg-foreground/20" />
              <p className="font-mono text-[10px] tracking-[0.3em] ink-faint">
                SCALE · {theory.scale}
              </p>
            </div>
            <h1 className="mb-8 font-display text-balance text-4xl leading-[1.05] md:text-6xl">
              {theory.title}
            </h1>
            <div className={`glass-chip inline-block rounded px-4 py-3 ${ACCENT_BORDER[theory.accent]}`}>
              <p className={`font-mono text-sm ${ACCENT_TEXT[theory.accent]}`}>{theory.formula}</p>
            </div>
          </header>
        </Reveal>

        <div className="space-y-12 text-pretty text-lg leading-relaxed ink-muted">
          <Reveal>
            <section>
              <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
                THE PHYSICS
              </h3>
              <p>{theory.deepDive.physics}</p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section>
              <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
                THE SCENARIO
              </h3>
              <p>{theory.deepDive.scenario}</p>
            </section>
          </Reveal>

          <Reveal>
            <section className="glass rounded-2xl border border-red-500/25 p-8 shadow-[0_0_120px_-50px_rgba(248,113,113,0.7)]">
              <h3 className="mb-4 flex items-center gap-2 font-mono text-[12px] tracking-[0.2em] text-red-400">
                <AlertTriangle className="h-4 w-4" /> THE AGENCY GUESS
              </h3>
              <p className="mb-6">{theory.deepDive.agencyGuess}</p>
              <ComicFrame
                src={`${import.meta.env.BASE_URL}comics/${theory.id}-agency.webp`}
                alt={`Agency guess comic — ${theory.title}`}
                fallback={
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-950/20 p-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-red-400/70" />
                    <p className="font-mono text-[10px] leading-relaxed text-red-400/50">
                      {theory.deepDive.agencyComicPrompt}
                    </p>
                  </div>
                }
              />
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section className="glass rounded-2xl border border-cyan-500/25 p-8 shadow-[0_0_120px_-50px_rgba(34,211,238,0.7)]">
              <h3 className="mb-4 flex items-center gap-2 font-mono text-[12px] tracking-[0.2em] text-cyan-400">
                <Compass className="h-4 w-4" /> THE PHYSICIST'S REALIGNMENT
              </h3>
              <p className="mb-6">{theory.deepDive.physicistRealignment}</p>
              <ComicFrame
                src={`${import.meta.env.BASE_URL}comics/${theory.id}-physicist.webp`}
                alt={`Physicist realignment comic — ${theory.title}`}
                fallback={
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-6 text-center">
                    <Compass className="h-10 w-10 text-cyan-400/70" />
                    <p className="font-mono text-[10px] leading-relaxed text-cyan-400/50">
                      {theory.deepDive.physicistComicPrompt}
                    </p>
                  </div>
                }
              />
            </section>
          </Reveal>

          <Reveal>
            <section className={`glass rounded-2xl p-8 ${ACCENT_GLOW[theory.accent]}`}>
              <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
                THE TRANSLATION
              </h3>
              <p className="text-foreground">{theory.deepDive.translation}</p>
            </section>
          </Reveal>
        </div>

        <div className="mt-32 border-t hairline pt-12 text-center">
          <Link
            to={`/theory/${nextTheory.id}`}
            className="inline-flex items-center gap-2 rounded border hairline bg-foreground/5 px-8 py-4 font-mono text-[12px] tracking-[0.3em] text-foreground transition-colors hover:bg-foreground/10"
          >
            [ SIMULATE NEXT THEORY ] →
          </Link>
        </div>
      </article>
    </main>
  );
}

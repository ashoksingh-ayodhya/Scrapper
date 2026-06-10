import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import type Lenis from 'lenis';
import { theories } from '@/data/theories';
import { ACCENT_TEXT } from '@/lib/accents';
import SceneCanvas from '@/components/scenes/SceneCanvas';

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
      {/* Background Ambience: scaled up, blurred version of the theory's WebGL scene */}
      <div className="fixed inset-0 z-0 scale-110 blur-[8px] brightness-50">
        <SceneCanvas component={theory.visualComponent} accent={theory.accent} ambient />
      </div>

      <nav className="fixed left-5 top-5 z-40">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.4em] text-plasma transition-colors hover:text-foreground"
        >
          ← BACK TO ORBIT
        </Link>
      </nav>

      {/* The Reading Column */}
      <article className="relative z-10 mx-auto min-h-screen max-w-3xl border-x hairline bg-background/80 px-6 py-32 backdrop-blur-md md:px-12">
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
          <div className="inline-block rounded border hairline bg-card/60 px-4 py-3 backdrop-blur-sm">
            <p className={`font-mono text-sm ${ACCENT_TEXT[theory.accent]}`}>{theory.formula}</p>
          </div>
        </header>

        <div className="space-y-12 text-pretty text-lg leading-relaxed ink-muted">
          <section>
            <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
              THE PHYSICS
            </h3>
            <p>{theory.deepDive.physics}</p>
          </section>

          <section>
            <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
              THE SCENARIO
            </h3>
            <p>{theory.deepDive.scenario}</p>
          </section>

          <section className="rounded border border-red-500/30 bg-red-950/10 p-8">
            <h3 className="mb-4 font-mono text-[12px] tracking-[0.2em] text-red-400">
              THE AGENCY GUESS
            </h3>
            <p className="mb-6">{theory.deepDive.agencyGuess}</p>
            <div className="flex aspect-video w-full items-center justify-center rounded border border-red-500/20 bg-red-950/20 p-6 text-center">
              <p className="font-mono text-[10px] text-red-400/50">
                {theory.deepDive.agencyComicPrompt}
              </p>
            </div>
          </section>

          <section className="rounded border border-cyan-500/30 bg-cyan-950/10 p-8">
            <h3 className="mb-4 font-mono text-[12px] tracking-[0.2em] text-cyan-400">
              THE PHYSICIST'S REALIGNMENT
            </h3>
            <p className="mb-6">{theory.deepDive.physicistRealignment}</p>
            <div className="flex aspect-video w-full items-center justify-center rounded border border-cyan-500/20 bg-cyan-950/20 p-6 text-center">
              <p className="font-mono text-[10px] text-cyan-400/50">
                {theory.deepDive.physicistComicPrompt}
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-4 border-b hairline pb-2 font-mono text-[12px] tracking-[0.2em] text-foreground">
              THE TRANSLATION
            </h3>
            <p className="text-foreground">{theory.deepDive.translation}</p>
          </section>
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

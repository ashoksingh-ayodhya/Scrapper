import { theories } from '@/data/theories';
import SceneTeaser from '@/components/SceneTeaser';
import StarField from '@/components/mockup/StarField';
import DebrisField from '@/components/mockup/DebrisField';
import ConstellationHUD from '@/components/mockup/ConstellationHUD';
import SignalConsole from '@/components/mockup/SignalConsole';

export default function Index() {
  return (
    <main id="top" className="relative min-h-screen overflow-x-hidden">
      <StarField count={140} />
      <DebrisField count={16} />
      <ConstellationHUD unlocked={20} total={20} />

      <header className="fixed left-5 top-5 z-40 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-plasma animate-pulse-glow" />
        <a
          href="#top"
          className="font-mono text-[10px] tracking-[0.4em] ink-faint hover:text-foreground"
        >
          ASHOK · WHOISASHOK.COM
        </a>
      </header>

      {/* HERO PROLOGUE */}
      <section className="relative flex min-h-screen snap-center flex-col items-center justify-center px-6 py-20 text-center">
        <div className="glass rounded-3xl px-8 py-12 md:px-16 md:py-16">
          <p className="font-mono text-[11px] tracking-[0.5em] text-plasma">
            PROLOGUE · 00 · THE UNIVERSE IS A B2B PIPELINE
          </p>
          <h1 className="mt-6 max-w-5xl font-display text-balance text-5xl leading-[0.95] md:text-8xl">
            Marketing is physics.
            <br />
            <span className="italic ink-muted">I'm the physicist.</span>
          </h1>
          <p className="mt-12 font-mono text-[10px] tracking-[0.3em] ink-faint">
            ↓ scroll to fall through twenty theories ↓
          </p>
        </div>
      </section>

      {/* 20 THEORIES LOOP */}
      {theories.map((t, i) => (
        <SceneTeaser key={t.id} data={t} reverse={i % 2 !== 0} />
      ))}

      {/* TERMINAL BACKDOOR */}
      <SignalConsole />

      <footer className="border-t hairline px-6 py-10 text-center">
        <p className="font-mono text-[9px] tracking-[0.4em] ink-faint">
          © {new Date().getFullYear()} ASHOK SINGH · MARKETING IS PHYSICS
        </p>
      </footer>
    </main>
  );
}

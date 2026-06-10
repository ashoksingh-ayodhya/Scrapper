import { useEffect, useRef, useState } from 'react';
import type Lenis from 'lenis';

const targetHackString = `[OPTIMIZING PAYLOAD] -> "Ashok, the funnel is broken. Let's bend physics."`;

const genericIntros = ['hi ashok, i am r', 'hello ashok, i a', 'dear ashok, we a'];

export default function SignalConsole() {
  const [payload, setPayload] = useState('');
  const [isHacked, setIsHacked] = useState(false);
  const [hackedText, setHackedText] = useState('');
  const typeInterval = useRef<ReturnType<typeof setInterval>>(null);

  const handlePayload = (value: string) => {
    // 1. The Easter Egg Scroll Override
    if (value === 'override_budget=true') {
      const lenis = (window as unknown as { lenis?: Lenis }).lenis;
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.5, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
        setPayload(''); // Reset
        return;
      }
    }
    setPayload(value);
    // 2. The Auto-Correct Hack for generic corporate intros
    if (value.length > 15 && !isHacked) {
      const lower = value.toLowerCase();
      if (genericIntros.some((intro) => lower.includes(intro))) {
        setIsHacked(true);
        let i = 0;
        typeInterval.current = setInterval(() => {
          setHackedText(targetHackString.substring(0, i));
          i++;
          if (i > targetHackString.length && typeInterval.current) {
            clearInterval(typeInterval.current);
          }
        }, 50);
      }
    }
  };

  useEffect(
    () => () => {
      if (typeInterval.current) clearInterval(typeInterval.current);
    },
    [],
  );

  return (
    <section className="relative mx-auto max-w-5xl snap-center px-6 py-32 md:px-12">
      <p className="mb-4 font-mono text-[11px] tracking-[0.3em] text-violet">
        TRANSMISSION · CONSOLE
      </p>
      <h2 className="font-display text-5xl leading-[1.05] md:text-7xl">Send a signal.</h2>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="rounded border hairline bg-card/40 p-6 backdrop-blur-sm md:col-span-7">
          <div className="mb-4">
            <label className="mb-1 block font-mono text-[9px] tracking-[0.3em] ink-faint">
              PAYLOAD
            </label>
            <div className="relative">
              <textarea
                value={payload}
                onChange={(e) => handlePayload(e.target.value)}
                className={`w-full rounded border hairline bg-background/60 px-3 py-6 font-mono text-sm focus:border-violet/50 focus:outline-none ${
                  isHacked ? 'text-red-500/50 line-through' : 'text-foreground'
                }`}
                placeholder="type 'override_budget=true'"
                rows={4}
              />
              {isHacked && (
                <div className="pointer-events-none absolute inset-0 p-3 pt-6 font-mono text-sm text-acid">
                  {hackedText}
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </div>
          <button className="mt-2 inline-flex items-center gap-2 rounded border hairline bg-violet/10 px-5 py-3 font-mono text-[11px] tracking-[0.3em] text-violet transition-colors hover:bg-violet/20">
            BROADCAST →
          </button>
        </div>
      </div>
    </section>
  );
}

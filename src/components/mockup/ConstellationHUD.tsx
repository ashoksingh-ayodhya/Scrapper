import { theories } from '@/data/theories';
import { usePhysicsStore } from '@/store/usePhysicsStore';

export default function ConstellationHUD({
  unlocked = 20,
  total = 20,
}: {
  unlocked?: number;
  total?: number;
}) {
  const activeTheory = usePhysicsStore((s) => s.activeTheory);

  return (
    <aside
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex"
      aria-hidden="true"
    >
      <p className="mb-2 rotate-180 font-mono text-[9px] tracking-[0.4em] ink-faint [writing-mode:vertical-rl]">
        CONSTELLATION · {unlocked}/{total}
      </p>
      {theories.map((t) => (
        <span
          key={t.id}
          title={`THEORY ${t.index}`}
          className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
            activeTheory === t.id
              ? 'scale-150 bg-plasma shadow-[0_0_8px_hsl(186_100%_60%/0.9)]'
              : 'bg-foreground/25'
          }`}
        />
      ))}
    </aside>
  );
}

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

/**
 * One-shot scroll reveal: fades + slides a block into place the first time it
 * enters the viewport, then stays put. Used on the deep-dive pages so each
 * reading section arrives with a beat — paired with the live scene, it's the
 * "read it, see it, 10 seconds" rhythm from the brief.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  const inView = useInView(ref, { rootMargin: '-10% 0px', threshold: 0.1 });
  if (inView) seenRef.current = true;
  const revealed = seenRef.current;

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

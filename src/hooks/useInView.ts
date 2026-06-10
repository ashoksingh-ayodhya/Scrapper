import { useEffect, useState, type RefObject } from 'react';

interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number;
  onEnter?: () => void;
}

export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', threshold = 0, onEnter }: UseInViewOptions = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) onEnter?.();
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, threshold]);

  return inView;
}

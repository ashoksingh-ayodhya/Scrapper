import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import ShatterLayer from '@/components/ShatterLayer';
import Index from '@/pages/Index';
import TheoryDeepDive from '@/pages/TheoryDeepDive';

// THE GLOBAL PHYSICS HACKS (No creative decisions left to developers)
const GlobalPhysicsHacks = () => {
  useEffect(() => {
    // 1. Lenis Smooth Scroll Setup & Scroll-Wind Hack Pipeline
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on('scroll', (e: Lenis) => {
      // Pipe velocity to global state for the WebGL scenes
      usePhysicsStore.setState({ scrollVelocity: e.velocity });
    });

    // TextSpringRig: Hooke's Law snap on display type. Refresh the element
    // cache periodically since sections mount/unmount while scrolling.
    let springEls: HTMLElement[] = [];
    let distorted = false;
    let frame = 0;
    let rafId = 0;

    function raf(time: number) {
      lenis.raf(time);

      if (frame % 90 === 0) {
        springEls = Array.from(document.querySelectorAll<HTMLElement>('.font-display, h1, h2'));
      }
      frame++;

      const v = usePhysicsStore.getState().scrollVelocity;
      const speed = Math.abs(v);
      if (speed > 0.5) {
        distorted = true;
        const skew = gsap.utils.clamp(-8, 8, v * 0.35);
        const stretch = 1 + Math.min(speed * 0.0022, 0.06);
        for (const el of springEls) {
          el.style.transform = `skewX(${-skew}deg) scaleX(${stretch})`;
        }
      } else if (distorted) {
        distorted = false;
        for (const el of springEls) {
          el.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
          el.style.transform = 'skewX(0deg) scaleX(1)';
          setTimeout(() => {
            el.style.transition = '';
          }, 400);
        }
        // Velocity has settled — make sure the store reflects rest state.
        if (usePhysicsStore.getState().scrollVelocity !== 0 && speed < 0.05) {
          usePhysicsStore.setState({ scrollVelocity: 0 });
        }
      }

      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Make lenis globally available for the Terminal Hack
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    // 2. The Highlight-Shatter Hack
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const anchor = selection.anchorNode?.parentElement;
        if (anchor && anchor.closest('.font-mono')) {
          const rect = anchor.getBoundingClientRect();
          const text = anchor.textContent ?? selection.toString();
          // Hide DOM text
          anchor.style.opacity = '0';
          // Dispatch event for the shatter Canvas to pick up and explode
          window.dispatchEvent(
            new CustomEvent('shatter-text', { detail: { text, rect } }),
          );
          // Reset after 3s
          setTimeout(() => {
            anchor.style.opacity = '1';
            selection.removeAllRanges();
          }, 3000);
        }
      }
    };
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <GlobalPhysicsHacks />
      <ShatterLayer />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/theory/:id" element={<TheoryDeepDive />} />
      </Routes>
    </BrowserRouter>
  );
}

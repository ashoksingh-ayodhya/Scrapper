import { create } from 'zustand';

interface PhysicsState {
  scrollVelocity: number;
  setScrollVelocity: (v: number) => void;
  activeTheory: string | null;
  setActiveTheory: (id: string) => void;
}

export const usePhysicsStore = create<PhysicsState>((set) => ({
  scrollVelocity: 0,
  setScrollVelocity: (v) => set({ scrollVelocity: v }),
  activeTheory: null,
  setActiveTheory: (id) => set({ activeTheory: id }),
}));

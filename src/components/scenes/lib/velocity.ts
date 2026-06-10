import { usePhysicsStore } from '@/store/usePhysicsStore';

/**
 * Read the current Lenis scroll velocity without a React subscription.
 * Scenes call this inside useFrame so velocity never causes re-renders.
 */
export const readVelocity = () => usePhysicsStore.getState().scrollVelocity;

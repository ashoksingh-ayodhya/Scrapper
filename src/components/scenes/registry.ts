import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface SceneProps {
  /** Accent hex color for the scene's primary materials. */
  accent: string;
  /** Deep-dive background mode: no pointer interaction, reduced counts. */
  ambient?: boolean;
}

type SceneComponent = LazyExoticComponent<ComponentType<SceneProps>>;

export const sceneRegistry: Record<string, SceneComponent> = {
  GravityFunnel: lazy(() => import('./GravityFunnel')),
  MarkovGraph: lazy(() => import('./MarkovGraph')),
  LorenzChaos: lazy(() => import('./LorenzChaos')),
  MandelbrotEconomics: lazy(() => import('./MandelbrotEconomics')),
  WaveCollapse: lazy(() => import('./WaveCollapse')),
  GravitationalLensing: lazy(() => import('./GravitationalLensing')),
  EntropyDecay: lazy(() => import('./EntropyDecay')),
  BassDiffusion: lazy(() => import('./BassDiffusion')),
  MetcalfeMesh: lazy(() => import('./MetcalfeMesh')),
  NashMatrix: lazy(() => import('./NashMatrix')),
  PowerLaw: lazy(() => import('./PowerLaw')),
  ShannonChannel: lazy(() => import('./ShannonChannel')),
  TuringPatterns: lazy(() => import('./TuringPatterns')),
  BrownianWalk: lazy(() => import('./BrownianWalk')),
  HarmonicResonance: lazy(() => import('./HarmonicResonance')),
  BayesianUpdate: lazy(() => import('./BayesianUpdate')),
  Entanglement: lazy(() => import('./Entanglement')),
  ObserverEffect: lazy(() => import('./ObserverEffect')),
  ActivationEnergy: lazy(() => import('./ActivationEnergy')),
  FluidDynamics: lazy(() => import('./FluidDynamics')),
};

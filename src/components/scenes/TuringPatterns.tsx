import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const SIM = 128;

const SIM_FRAG = /* glsl */ `
  uniform sampler2D uPrev;
  uniform vec2 uTexel;
  uniform float uFeed;
  uniform float uKill;
  uniform vec2 uMouse;
  uniform float uPaint;
  varying vec2 vUv;

  void main() {
    vec2 c = texture2D(uPrev, vUv).rg;
    vec2 lap = -4.0 * c
      + texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).rg
      + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).rg
      + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).rg
      + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).rg;
    float a = c.r;
    float b = c.g;
    float reaction = a * b * b;
    float da = 1.0 * lap.r - reaction + uFeed * (1.0 - a);
    float db = 0.5 * lap.g + reaction - (uKill + uFeed) * b;
    a += da; b += db;
    if (uPaint > 0.5 && distance(vUv, uMouse) < 0.035) b = 0.9;
    gl_FragColor = vec4(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0), 0.0, 1.0);
  }
`;

const DISPLAY_FRAG = /* glsl */ `
  uniform sampler2D uState;
  uniform vec3 uAccent;
  varying vec2 vUv;
  void main() {
    float b = texture2D(uState, vUv).g;
    float v = smoothstep(0.08, 0.42, b);
    vec3 col = mix(vec3(0.012, 0.015, 0.04), uAccent, v);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function makeTarget() {
  return new THREE.WebGLRenderTarget(SIM, SIM, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

/**
 * Theory 13 — Gray-Scott reaction-diffusion on ping-pong render targets.
 * Spots precipitate from noise; move the pointer to paint chemical B.
 */
export default function TuringPatterns({ accent, ambient }: SceneProps) {
  const { gl, pointer, viewport } = useThree();
  const flip = useRef(false);
  const seeded = useRef(false);

  const sim = useMemo(() => {
    const targetA = makeTarget();
    const targetB = makeTarget();
    const simMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        uPrev: { value: null },
        uTexel: { value: new THREE.Vector2(1 / SIM, 1 / SIM) },
        uFeed: { value: 0.037 },
        uKill: { value: 0.06 },
        uMouse: { value: new THREE.Vector2(-1, -1) },
        uPaint: { value: 0 },
      },
    });
    const displayMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: DISPLAY_FRAG,
      uniforms: {
        uState: { value: null },
        uAccent: { value: new THREE.Color(accent) },
      },
    });
    // seed texture: A=1 everywhere, random islands of B
    const data = new Float32Array(SIM * SIM * 4);
    for (let i = 0; i < SIM * SIM; i++) {
      data[i * 4] = 1;
      data[i * 4 + 1] = Math.random() < 0.015 ? 0.6 + Math.random() * 0.4 : 0;
      data[i * 4 + 3] = 1;
    }
    const seedTex = new THREE.DataTexture(data, SIM, SIM, THREE.RGBAFormat, THREE.FloatType);
    seedTex.needsUpdate = true;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(quadGeo, simMat));
    return { targetA, targetB, simMat, displayMat, seedTex, scene, camera, quadGeo };
  }, [accent]);

  useEffect(
    () => () => {
      sim.targetA.dispose();
      sim.targetB.dispose();
      sim.simMat.dispose();
      sim.displayMat.dispose();
      sim.seedTex.dispose();
      sim.quadGeo.dispose();
    },
    [sim],
  );

  useFrame(() => {
    const wind = Math.abs(readVelocity());
    sim.simMat.uniforms.uFeed.value = 0.037 + Math.min(wind * 0.0002, 0.012);
    if (!ambient) {
      (sim.simMat.uniforms.uMouse.value as THREE.Vector2).set(
        (pointer.x + 1) / 2,
        (pointer.y + 1) / 2,
      );
      sim.simMat.uniforms.uPaint.value = Math.abs(pointer.x) < 1 ? 1 : 0;
    }

    const steps = ambient ? 4 : 8;
    for (let s = 0; s < steps; s++) {
      const src = seeded.current ? (flip.current ? sim.targetB : sim.targetA) : null;
      const dst = flip.current ? sim.targetA : sim.targetB;
      sim.simMat.uniforms.uPrev.value = src ? src.texture : sim.seedTex;
      gl.setRenderTarget(dst);
      gl.render(sim.scene, sim.camera);
      seeded.current = true;
      flip.current = !flip.current;
    }
    gl.setRenderTarget(null);
    sim.displayMat.uniforms.uState.value = (flip.current ? sim.targetB : sim.targetA).texture;
  });

  return (
    <mesh material={sim.displayMat} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

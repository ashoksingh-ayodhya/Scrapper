import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const FRAGMENT = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uZoom;
  uniform float uAspect;
  uniform float uShift;
  uniform vec3 uAccent;
  varying vec2 vUv;

  void main() {
    vec2 c = uCenter + (vUv - 0.5) * vec2(uAspect, 1.0) * (3.0 / uZoom);
    vec2 z = vec2(0.0);
    float escape = 0.0;
    for (int i = 0; i < 96; i++) {
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
      if (dot(z, z) > 4.0) { escape = float(i); break; }
    }
    if (escape == 0.0) {
      // bounded: the sustainable-business interior
      gl_FragColor = vec4(0.01, 0.012, 0.03, 1.0);
    } else {
      float t = fract(escape / 32.0 + uShift);
      vec3 col = mix(vec3(0.02, 0.02, 0.06), uAccent, smoothstep(0.0, 0.85, t));
      gl_FragColor = vec4(col, 1.0);
    }
  }
`;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Theory 04 — escape-time Mandelbrot. Drag to pan; the zoom breathes in and
 * out of the seahorse valley. Scroll velocity shifts the palette.
 */
export default function MandelbrotEconomics({ accent, ambient }: SceneProps) {
  const { viewport, gl, pointer } = useThree();
  const dragging = useRef(false);
  const lastPointer = useRef(new THREE.Vector2());
  const center = useRef(new THREE.Vector2(-0.743, 0.155));

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fragmentShader: FRAGMENT,
        vertexShader: VERTEX,
        uniforms: {
          uCenter: { value: new THREE.Vector2(-0.743, 0.155) },
          uZoom: { value: 1 },
          uAspect: { value: 1 },
          uShift: { value: 0 },
          uAccent: { value: new THREE.Color(accent) },
        },
      }),
    [accent],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const down = () => {
      dragging.current = true;
      lastPointer.current.set(pointer.x, pointer.y);
    };
    const up = () => (dragging.current = false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, ambient, pointer]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // logarithmic breathe between overview and deep zoom
    const zoom = Math.pow(10, 1.1 + Math.sin(t * 0.16) * 1.05);
    material.uniforms.uZoom.value = zoom;
    material.uniforms.uAspect.value = viewport.width / viewport.height;
    material.uniforms.uShift.value = t * 0.02 + Math.abs(readVelocity()) * 0.004;

    if (dragging.current) {
      const dx = pointer.x - lastPointer.current.x;
      const dy = pointer.y - lastPointer.current.y;
      center.current.x -= (dx * 1.5) / zoom;
      center.current.y -= (dy * 1.5) / zoom;
      lastPointer.current.set(pointer.x, pointer.y);
    }
    (material.uniforms.uCenter.value as THREE.Vector2).lerp(center.current, 0.2);
  });

  return (
    <mesh material={material} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

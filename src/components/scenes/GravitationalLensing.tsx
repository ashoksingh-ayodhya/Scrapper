import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneProps } from './registry';
import { readVelocity } from './lib/velocity';

const STARS = 1800;

const VERTEX = /* glsl */ `
  uniform vec2 uMouse;
  uniform float uStrength;
  void main() {
    vec3 p = position;
    vec2 d = p.xy - uMouse;
    float r = length(d) + 0.0001;
    // light bends around the unseen mass: pull tangentially with 1/r falloff
    float bend = uStrength / (r * r + 0.4);
    vec2 dir = normalize(d);
    p.xy += vec2(-dir.y, dir.x) * bend + dir * bend * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 2.2 * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(uColor, 0.8);
  }
`;

/**
 * Theory 06 — the pointer is an invisible mass that lenses the starlight.
 * Click and hold to reveal the hidden dark-social web.
 */
export default function GravitationalLensing({ accent, ambient }: SceneProps) {
  const holding = useRef(false);
  const reveal = useRef(0);
  const webMat = useRef<THREE.LineBasicMaterial>(null);
  const { gl, pointer, viewport } = useThree();

  const starPositions = useMemo(() => {
    const out = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      out[i * 3] = (Math.random() - 0.5) * 18;
      out[i * 3 + 1] = (Math.random() - 0.5) * 12;
      out[i * 3 + 2] = -Math.random() * 4;
    }
    return out;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMouse: { value: new THREE.Vector2(99, 99) },
          uStrength: { value: 0.6 },
          uColor: { value: new THREE.Color('#cfd4e8') },
        },
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  // the hidden web of dark social: a sparse random graph
  const webGeometry = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < 26; i++) {
      nodes.push(
        new THREE.Vector3((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 8, -1),
      );
    }
    const pts: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 4.2) {
          pts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  useEffect(() => {
    if (ambient) return;
    const el = gl.domElement;
    const down = () => (holding.current = true);
    const up = () => (holding.current = false);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, ambient]);

  useFrame(() => {
    const wind = Math.abs(readVelocity());
    const mouse = material.uniforms.uMouse.value as THREE.Vector2;
    if (ambient) {
      mouse.set(0, 0);
    } else {
      mouse.lerp(
        new THREE.Vector2((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2),
        0.12,
      );
    }
    material.uniforms.uStrength.value = 0.6 + Math.min(wind * 0.02, 1.2);

    reveal.current += ((holding.current ? 1 : 0) - reveal.current) * 0.06;
    if (webMat.current) webMat.current.opacity = reveal.current * 0.55;
  });

  return (
    <group>
      <points material={material}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
      </points>
      <lineSegments geometry={webGeometry}>
        <lineBasicMaterial ref={webMat} color={accent} transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

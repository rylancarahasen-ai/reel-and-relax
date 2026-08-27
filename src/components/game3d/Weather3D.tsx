import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

export interface WeatherPreset {
  sky: { sunPosition: [number, number, number]; turbidity: number; rayleigh: number; inclination?: number };
  ambient: number;
  sun: number;
  sunColor: string;
  fog: string;
  fogDensity: number;
}

export const WEATHER_PRESETS: Record<string, WeatherPreset> = {
  sunset: {
    sky: { sunPosition: [40, 4, -100], turbidity: 8, rayleigh: 3.2 },
    ambient: 0.72,
    sun: 1.7,
    sunColor: '#ff9f6b',
    fog: '#8a6a70',
    fogDensity: 0.008,
  },
  mountain: {
    sky: { sunPosition: [60, 40, -80], turbidity: 6, rayleigh: 1.2 },
    ambient: 0.75,
    sun: 1.1,
    sunColor: '#cfd8dc',
    fog: '#9aa7ad',
    fogDensity: 0.012,
  },
  snow: {
    sky: { sunPosition: [30, 25, -100], turbidity: 12, rayleigh: 0.6 },
    ambient: 1.0,
    sun: 0.7,
    sunColor: '#e8f1ff',
    fog: '#cdd8e2',
    fogDensity: 0.02,
  },
  rain: {
    sky: { sunPosition: [10, 12, -100], turbidity: 18, rayleigh: 0.4 },
    ambient: 0.6,
    sun: 0.5,
    sunColor: '#8fa1b8',
    fog: '#4c5764',
    fogDensity: 0.024,
  },
  starry: {
    sky: { sunPosition: [0, -20, -100], turbidity: 0.2, rayleigh: 0.2 },
    ambient: 0.32,
    sun: 0.25,
    sunColor: '#8fa8ff',
    fog: '#0d1226',
    fogDensity: 0.01,
  },
};

function Precipitation({ kind }: { kind: 'rain' | 'snow' }) {
  const ref = useRef<THREE.Points>(null);
  const count = kind === 'rain' ? 4000 : 2200;
  const spread = 70;
  const height = 40;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = Math.random() * height;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points) return;
    const cam = state.camera.position;
    points.position.set(cam.x, 0, cam.z);
    const attr = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const speed = kind === 'rain' ? 34 : 3.2;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speed * delta;
      if (kind === 'snow') {
        arr[i * 3] += Math.sin(state.clock.elapsedTime + i) * delta * 0.5;
      }
      if (arr[i * 3 + 1] < -1) {
        arr[i * 3 + 1] = height;
        arr[i * 3] = (Math.random() - 0.5) * spread;
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={kind === 'rain' ? '#9ec6ff' : '#ffffff'}
        size={kind === 'rain' ? 0.09 : 0.16}
        sizeAttenuation
        transparent
        opacity={kind === 'rain' ? 0.55 : 0.9}
        depthWrite={false}
      />
    </points>
  );
}

export default function Weather3D({ weather }: { weather: string }) {
  const preset = WEATHER_PRESETS[weather] ?? WEATHER_PRESETS.sunset;

  return (
    <group>
      <fogExp2 attach="fog" args={[preset.fog, preset.fogDensity]} />
      <Sky
        distance={4500}
        sunPosition={preset.sky.sunPosition}
        turbidity={preset.sky.turbidity}
        rayleigh={preset.sky.rayleigh}
        mieCoefficient={0.006}
        mieDirectionalG={0.85}
      />
      {weather === 'starry' && <Stars radius={200} depth={60} count={4000} factor={5} fade speed={0.6} />}
      <ambientLight intensity={preset.ambient} />
      <hemisphereLight args={[preset.fog, '#2b2b2b', preset.ambient * 0.7]} />
      <directionalLight
        position={preset.sky.sunPosition}
        intensity={preset.sun}
        color={preset.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {weather === 'rain' && <Precipitation kind="rain" />}
      {weather === 'snow' && <Precipitation kind="snow" />}
    </group>
  );
}

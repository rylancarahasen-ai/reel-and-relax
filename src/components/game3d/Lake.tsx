import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WATER_Y } from './fishingEngine';

const WATER_COLORS: Record<string, string> = {
  sunset: '#3b3a6b',
  mountain: '#2f4048',
  snow: '#4a6b86',
  rain: '#26364f',
  starry: '#141b3a',
};

interface LakeProps {
  weather: string;
}

export default function Lake({ weather }: LakeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(220, 220, 90, 90), []);
  const basePositions = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const color = WATER_COLORS[weather] ?? WATER_COLORS.sunset;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const wave =
        Math.sin(x * 0.18 + t * 0.9) * 0.09 +
        Math.sin(y * 0.23 + t * 1.3) * 0.07 +
        Math.sin((x + y) * 0.09 + t * 0.5) * 0.05;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y, -60]} receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.18}
        transparent
        opacity={0.94}
      />
    </mesh>
  );
}

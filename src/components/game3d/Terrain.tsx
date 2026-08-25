import { useMemo } from 'react';
import * as THREE from 'three';

const GROUND_COLORS: Record<string, string> = {
  sunset: '#4a4230',
  mountain: '#3f4438',
  snow: '#dfe7ee',
  rain: '#333a2c',
  starry: '#23241f',
};

const MOUNTAIN_COLORS: Record<string, string> = {
  sunset: '#4a3f56',
  mountain: '#59636b',
  snow: '#c9d6e2',
  rain: '#39424f',
  starry: '#20233d',
};

interface TerrainProps {
  weather: string;
}

function Mountain({ x, z, h, r, color }: { x: number; z: number; h: number; r: number; color: string }) {
  return (
    <mesh position={[x, h / 2 - 1, z]}>
      <coneGeometry args={[r, h, 5]} />
      <meshStandardMaterial color={color} flatShading roughness={1} />
    </mesh>
  );
}

export default function Terrain({ weather }: TerrainProps) {
  const ground = GROUND_COLORS[weather] ?? GROUND_COLORS.sunset;
  const rock = MOUNTAIN_COLORS[weather] ?? MOUNTAIN_COLORS.sunset;

  const mountains = useMemo(() => {
    const list: { x: number; z: number; h: number; r: number }[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 1.6 + Math.PI * 0.7;
      const dist = 120 + rand() * 45;
      list.push({
        x: Math.cos(angle) * dist,
        z: -Math.abs(Math.sin(angle) * dist) - 40,
        h: 40 + rand() * 60,
        r: 26 + rand() * 22,
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* shore */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 28]} receiveShadow>
        <planeGeometry args={[160, 44]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      {/* side banks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-62, 0.15, -20]} receiveShadow>
        <planeGeometry args={[64, 60]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[62, 0.15, -20]} receiveShadow>
        <planeGeometry args={[64, 60]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      {/* far bank */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, -110]} receiveShadow>
        <planeGeometry args={[300, 90]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      {mountains.map((m, i) => (
        <Mountain key={i} x={m.x} z={m.z} h={m.h} r={m.r} color={rock} />
      ))}
    </group>
  );
}

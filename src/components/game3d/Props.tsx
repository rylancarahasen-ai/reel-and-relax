import { useMemo } from 'react';
import * as THREE from 'three';

const TRUNK = '#4a2c17';
const FOLIAGE: Record<string, string> = {
  sunset: '#20402c',
  mountain: '#25382c',
  snow: '#e6eef4',
  rain: '#1c3324',
  starry: '#12251b',
};

function PineTree({ x, z, s, color }: { x: number; z: number; s: number; color: string }) {
  return (
    <group position={[x, 0.15, z]} scale={s}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.38, 2.4, 6]} />
        <meshStandardMaterial color={TRUNK} roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 2.6 + i * 1.5, 0]} castShadow>
          <coneGeometry args={[2.2 - i * 0.55, 2.6, 7]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Dock() {
  const planks = useMemo(() => Array.from({ length: 14 }, (_, i) => 7.5 - i * 1.05), []);
  return (
    <group>
      {planks.map((z, i) => (
        <mesh key={i} position={[0, 0.9, z]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.16, 0.9]} />
          <meshStandardMaterial color={i % 2 ? '#7a5433' : '#8b5a3c'} roughness={0.9} />
        </mesh>
      ))}
      {[-1.8, 1.8].map((x) =>
        planks
          .filter((_, i) => i % 4 === 0)
          .map((z, i) => (
            <mesh key={`${x}-${i}`} position={[x, 0.1, z]} castShadow>
              <cylinderGeometry args={[0.16, 0.16, 1.8, 6]} />
              <meshStandardMaterial color="#3c2513" roughness={1} />
            </mesh>
          ))
      )}
      {/* railing posts near the end */}
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 1.4, -6.2]} castShadow>
          <boxGeometry args={[0.18, 1, 0.18]} />
          <meshStandardMaterial color="#5c3a20" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Cabin({ weather }: { weather: string }) {
  const glow = weather === 'starry' || weather === 'rain' ? 1.4 : 0.6;
  return (
    <group position={[-17, 0.15, 17]} rotation={[0, Math.PI * 0.15, 0]}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 7]} />
        <meshStandardMaterial color="#6b4423" roughness={1} />
      </mesh>
      <mesh position={[0, 4.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[6.4, 2.4, 4]} />
        <meshStandardMaterial color="#4a2c17" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.3, 3.55]}>
        <boxGeometry args={[1.6, 2.6, 0.14]} />
        <meshStandardMaterial color="#3c1810" roughness={1} />
      </mesh>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 2.4, 3.55]}>
          <boxGeometry args={[1.4, 1.2, 0.12]} />
          <meshStandardMaterial color="#ffd479" emissive="#ffb347" emissiveIntensity={glow} />
        </mesh>
      ))}
      <mesh position={[2.6, 5.6, -1.5]}>
        <boxGeometry args={[0.9, 2.6, 0.9]} />
        <meshStandardMaterial color="#57402e" roughness={1} />
      </mesh>
      <pointLight position={[0, 2.6, 4.4]} intensity={glow * 6} distance={14} color="#ffb347" />
    </group>
  );
}

function Grave() {
  return (
    <group position={[16, 0.15, 16]} rotation={[0, -Math.PI * 0.12, 0]}>
      <mesh position={[0, 0.12, 0.6]} receiveShadow>
        <boxGeometry args={[2.2, 0.24, 1.2]} />
        <meshStandardMaterial color="#9e9e9e" roughness={1} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.34, 2.2, 0.22]} />
        <meshStandardMaterial color="#795548" roughness={1} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.5, 0.34, 0.22]} />
        <meshStandardMaterial color="#795548" roughness={1} />
      </mesh>
      {[-0.5, 0, 0.5].map((x) => (
        <group key={x} position={[x, 0.3, 0.9]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 5]} />
            <meshStandardMaterial color="#388e3c" />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#e53935" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Props({ weather }: { weather: string }) {
  const foliage = FOLIAGE[weather] ?? FOLIAGE.sunset;

  const trees = useMemo(() => {
    const list: { x: number; z: number; s: number }[] = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 70; i++) {
      const x = (rand() - 0.5) * 130;
      const z = 9 + rand() * 38;
      if (Math.abs(x) < 7 && z < 16) continue;
      if (x > -25 && x < -8 && z > 10 && z < 25) continue;
      if (x > 9 && x < 24 && z > 10 && z < 22) continue;
      list.push({ x, z, s: 0.8 + rand() * 1.1 });
    }
    for (let i = 0; i < 46; i++) {
      const side = rand() > 0.5 ? 1 : -1;
      list.push({ x: side * (46 + rand() * 40), z: -rand() * 70, s: 0.9 + rand() * 1.2 });
    }
    for (let i = 0; i < 40; i++) {
      list.push({ x: (rand() - 0.5) * 260, z: -80 - rand() * 45, s: 1.2 + rand() * 1.4 });
    }
    return list;
  }, []);

  return (
    <group>
      <Dock />
      <Cabin weather={weather} />
      <Grave />
      {trees.map((t, i) => (
        <PineTree key={i} x={t.x} z={t.z} s={t.s} color={foliage} />
      ))}
      {/* a few shoreline rocks */}
      {[[-9, 7.5], [8, 8], [-14, 8.5], [13, 7.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <dodecahedronGeometry args={[0.7 + (i % 3) * 0.3, 0]} />
          <meshStandardMaterial color="#6a6a68" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

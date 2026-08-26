import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FishingEngine, WATER_Y } from './fishingEngine';

interface BobberProps {
  engine: FishingEngine;
}

export default function Bobber({ engine }: BobberProps) {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const splash = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const ringGeo = useMemo(() => new THREE.RingGeometry(0.22, 0.3, 24), []);

  useFrame((_, delta) => {
    t.current += delta;
    const g = group.current;
    if (!g) return;
    g.visible = engine.bobberVisible;
    if (!g.visible) return;
    g.position.copy(engine.bobber);

    const inWater = engine.phase !== 'flying';
    [ringA.current, ringB.current].forEach((ring, i) => {
      if (!ring) return;
      ring.visible = inWater;
      const p = ((t.current * 0.6 + i * 0.5) % 1);
      const s = 0.4 + p * 3.2;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.45;
      ring.position.y = WATER_Y - engine.bobber.y + 0.02;
    });

    if (splash.current) {
      splash.current.visible = engine.splash > 0;
      const p = 1 - engine.splash;
      splash.current.scale.setScalar(0.5 + p * 5);
      (splash.current.material as THREE.MeshBasicMaterial).opacity = engine.splash * 0.6;
      splash.current.position.y = WATER_Y - engine.bobber.y + 0.03;
    }
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh ref={ringA} geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#bfe3ff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#bfe3ff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={splash} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[0.35, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

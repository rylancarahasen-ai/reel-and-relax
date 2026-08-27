import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FishingEngine } from './fishingEngine';

interface RodViewProps {
  engine: FishingEngine;
}

/** First-person rod + hands, kept locked to the camera, plus the fishing line. */
export default function RodView({ engine }: RodViewProps) {
  const rig = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);
  const tipRef = useRef<THREE.Object3D>(null);
  const { camera } = useThree();
  const bob = useRef(0);

  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const mat = new THREE.LineBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.7 });
    const l = new THREE.Line(geo, mat);
    l.frustumCulled = false;
    return l;
  }, []);

  const tipWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const g = rig.current;
    if (!g) return;
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    bob.current += delta;
    const sway = Math.sin(bob.current * 1.6) * 0.012;

    if (rod.current) {
      const charge = engine.rodCharge;
      const swing = engine.rodSwing;
      const bend = engine.rodBend;
      rod.current.rotation.x = -0.08 + charge * 0.55 - swing * 0.7 - bend * 0.35;
      rod.current.rotation.z = 0.1 + charge * 0.1 + Math.sin(bob.current * 2.2) * 0.01;
      rod.current.position.y = -0.3 + sway + bend * 0.04;
      rod.current.position.z = -0.35 + charge * 0.06;
    }


    // line from rod tip to bobber
    if (tipRef.current) {
      tipRef.current.getWorldPosition(tipWorld);
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, tipWorld.x, tipWorld.y, tipWorld.z);
      const end = engine.bobberVisible ? engine.bobber : tipWorld;
      pos.setXYZ(1, end.x, end.y, end.z);
      pos.needsUpdate = true;
      line.visible = engine.bobberVisible;
      (line.material as THREE.LineBasicMaterial).color.set(engine.tension > 0.92 ? '#fca5a5' : '#e2e8f0');
    }
  });

  return (
    <>
      <primitive object={line} />
      <group ref={rig}>
        <group ref={rod} position={[0.36, -0.42, -0.5]} rotation={[-0.25, -0.12, 0.18]}>
          {/* handle */}
          <mesh position={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.035, 0.04, 0.28, 10]} />
            <meshStandardMaterial color="#3b2415" roughness={0.85} />
          </mesh>
          {/* reel */}
          <mesh position={[-0.06, -0.05, 0.02]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 14]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* blank */}
          <mesh position={[0, 0.32, -0.42]} rotation={[Math.PI / 2.35, 0, 0]}>
            <cylinderGeometry args={[0.007, 0.022, 1.5, 8]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
          <object3D ref={tipRef} position={[0, 0.86, -0.98]} />
          {/* hand */}
          <mesh position={[0.01, -0.05, 0.16]}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial color="#e0ac82" roughness={0.9} />
          </mesh>
          <mesh position={[0.02, -0.14, 0.24]}>
            <capsuleGeometry args={[0.06, 0.16, 4, 8]} />
            <meshStandardMaterial color="#3f6f4d" roughness={1} />
          </mesh>
        </group>
      </group>
    </>
  );
}

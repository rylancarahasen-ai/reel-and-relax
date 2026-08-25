import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

const EYE_HEIGHT = 1.7;
const DOCK_TOP = 0.9;
const DOCK_HALF_WIDTH = 2;
const SHORE_Z = 7;
const WALK = 4.2;
const RUN = 7.4;

interface PlayerProps {
  controlsRef: React.MutableRefObject<any>;
  onLockChange?: (locked: boolean) => void;
}

export default function Player({ controlsRef, onLockChange }: PlayerProps) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, DOCK_TOP + EYE_HEIGHT, 10);
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const forward = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
    const strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    const speed = k.ShiftLeft || k.ShiftRight ? RUN : WALK;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    const wish = new THREE.Vector3()
      .addScaledVector(dir, forward)
      .addScaledVector(right, strafe);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    velocity.current.lerp(wish, Math.min(1, dt * 12));

    const next = camera.position.clone().addScaledVector(velocity.current, dt);

    // world bounds
    next.x = THREE.MathUtils.clamp(next.x, -34, 34);
    next.z = THREE.MathUtils.clamp(next.z, -6, 34);

    const onDock = next.z < SHORE_Z && Math.abs(next.x) <= DOCK_HALF_WIDTH;
    if (next.z < SHORE_Z && !onDock) {
      // block walking into the lake — slide along the dock edge
      next.z = SHORE_Z;
    }

    // cabin collision
    if (next.x > -22 && next.x < -12 && next.z > 12 && next.z < 22) {
      next.copy(camera.position);
    }

    const groundY = next.z < SHORE_Z ? DOCK_TOP : 0.15;
    next.y = groundY + EYE_HEIGHT;
    camera.position.copy(next);
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => onLockChange?.(true)}
      onUnlock={() => onLockChange?.(false)}
    />
  );
}

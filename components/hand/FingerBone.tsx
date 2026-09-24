import { useMemo } from "react";
import * as THREE from "three";

export interface FingerBoneProps {
  length: number;
  radius: number;
  jointRadius: number;
  nail?: boolean;
  jointScale?: [number, number, number];
}

/**
 * One smooth anatomical-style phalanx.
 * The cylinder is deliberately high-resolution and tapered rather than
 * using box geometry so the procedural fallback does not read as a toy hand.
 */
export default function FingerBone({
  length,
  radius,
  jointRadius,
  nail = false,
  jointScale = [1.1, 0.85, 1]
}: FingerBoneProps) {
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(
      radius * 0.94,
      radius,
      length,
      24,
      3,
      false
    ),
    [length, radius]
  );

  const nailGeometry = useMemo(
    () => new THREE.BoxGeometry(radius * 1.8, 0.018, radius * 1.2),
    [radius]
  );

  return (
    <group>
      <mesh
        geometry={geometry}
        position={[0, length / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#c68642"
          roughness={0.65}
          metalness={0}
        />
      </mesh>

      <mesh
        scale={jointScale}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[jointRadius, 20, 14]} />
        <meshStandardMaterial
          color="#d4956a"
          roughness={0.62}
          metalness={0}
        />
      </mesh>

      {nail && (
        <mesh
          geometry={nailGeometry}
          position={[0, length - 0.035, radius * 0.72]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#e8d5c0"
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
      )}
    </group>
  );
}

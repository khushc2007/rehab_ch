import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import FingerBone from "./FingerBone";
import { useHandStore } from "@/store/handStore";
import type { Fingers } from "@/types/sensor";

type FingerConfig = {
  name: "INDEX" | "MIDDLE" | "RING" | "PINKY";
  baseX: number;
  lengths: [number, number, number];
  radii: [number, number, number];
};

const FINGERS: FingerConfig[] = [
  {
    name: "INDEX",
    baseX: -0.6,
    lengths: [0.9, 0.65, 0.42],
    radii: [0.095, 0.085, 0.072]
  },
  {
    name: "MIDDLE",
    baseX: -0.2,
    lengths: [1.0, 0.70, 0.45],
    radii: [0.100, 0.090, 0.075]
  },
  {
    name: "RING",
    baseX: 0.2,
    lengths: [0.92, 0.66, 0.43],
    radii: [0.093, 0.083, 0.070]
  },
  {
    name: "PINKY",
    baseX: 0.6,
    lengths: [0.68, 0.50, 0.33],
    radii: [0.078, 0.068, 0.058]
  }
];

const SKIN = "#c68642";
const JOINT = "#d4956a";
const NAIL = "#e8d5c0";
const EMG_TEAL = "#0F6E5E";

function deg(value: number) {
  return THREE.MathUtils.degToRad(value);
}

function smoothStep(current: number, target: number, delta: number) {
  // Required frame-independent smoothing factor.
  const factor = 1 - Math.pow(0.001, delta);
  return THREE.MathUtils.lerp(current, target, factor);
}

export default function HandModel() {
  const root = useRef<THREE.Group>(null);

  const smoothedFingers = useRef<Fingers>([74, 81, 76, 69, 22]);
  const smoothedWrist = useRef({ roll: 0, pitch: 0, yaw: 0 });
  const smoothedEmg = useRef(42);

  const fingers = useHandStore((state) => state.fingers);
  const emg = useHandStore((state) => state.emg);

  const palmMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: SKIN,
      roughness: 0.6,
      metalness: 0
    }),
    []
  );

  const jointMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: JOINT,
      roughness: 0.62,
      metalness: 0
    }),
    []
  );

  const nailMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: NAIL,
      roughness: 0.3,
      metalness: 0.05
    }),
    []
  );

  useFrame((_, delta) => {
    if (!root.current) return;

    for (let i = 0; i < 5; i++) {
      smoothedFingers.current[i] = smoothStep(
        smoothedFingers.current[i],
        fingers[i],
        delta
      );
    }

    const state = useHandStore.getState();

    smoothedWrist.current.roll = smoothStep(
      smoothedWrist.current.roll,
      state.wristRoll,
      delta
    );
    smoothedWrist.current.pitch = smoothStep(
      smoothedWrist.current.pitch,
      state.wristPitch,
      delta
    );
    smoothedWrist.current.yaw = smoothStep(
      smoothedWrist.current.yaw,
      state.wristYaw,
      delta
    );
    smoothedEmg.current = smoothStep(
      smoothedEmg.current,
      emg,
      delta
    );

    root.current.rotation.set(
      deg(smoothedWrist.current.pitch),
      deg(smoothedWrist.current.yaw),
      deg(smoothedWrist.current.roll)
    );
  });

  return (
    <group ref={root}>
      <Palm material={palmMaterial} />
      <Forearm material={palmMaterial} />
      <Wrist material={jointMaterial} />

      {FINGERS.map((finger, index) => (
        <FingerChain
          key={finger.name}
          config={finger}
          angle={smoothedFingers.current[index]}
        />
      ))}

      <ThumbChain angle={smoothedFingers.current[4]} />

      {smoothedEmg.current > 30 && (
        <pointLight
          position={[0, 0, -1]}
          color={EMG_TEAL}
          intensity={(smoothedEmg.current / 100) * 1.5}
          distance={3}
        />
      )}
    </group>
  );
}

function Palm({ material }: { material: THREE.Material }) {
  return (
    <group>
      <mesh
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.8, 2.2, 0.35]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Subtle palm-volume layer to soften the hard rectangular silhouette. */}
      <mesh
        position={[0, 0.05, 0.17]}
        scale={[0.82, 0.92, 0.20]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 32, 20]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Anatomical palm creases as restrained geometry rather than decorative UI. */}
      <PalmCrease position={[-0.22, 0.18, 0.39]} rotation={-0.18} scale={0.72} />
      <PalmCrease position={[0.25, -0.04, 0.39]} rotation={0.08} scale={0.58} />
      <PalmCrease position={[-0.04, -0.43, 0.39]} rotation={-0.03} scale={0.48} />
    </group>
  );
}

function PalmCrease({
  position,
  rotation,
  scale
}: {
  position: [number, number, number];
  rotation: number;
  scale: number;
}) {
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(-0.42 * scale, 0, 0),
      new THREE.Vector3(-0.15 * scale, 0.035 * scale, 0),
      new THREE.Vector3(0.12 * scale, 0.01 * scale, 0),
      new THREE.Vector3(0.40 * scale, -0.05 * scale, 0)
    ];
    return new THREE.CatmullRomCurve3(points);
  }, [scale]);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 16, 0.0065, 5, false),
    [curve]
  );

  return (
    <mesh
      position={position}
      rotation={[0, 0, rotation]}
      geometry={geometry}
    >
      <meshStandardMaterial
        color="#8f5b3e"
        roughness={0.9}
        transparent
        opacity={0.22}
      />
    </mesh>
  );
}

function Forearm({ material }: { material: THREE.Material }) {
  return (
    <mesh
      position={[0, -1.8, 0]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[0.55, 0.7, 2.8, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Wrist({ material }: { material: THREE.Material }) {
  return (
    <mesh
      position={[0, -0.72, 0]}
      scale={[1, 0.85, 1]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[0.52, 24, 18]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function FingerChain({
  config,
  angle
}: {
  config: FingerConfig;
  angle: number;
}) {
  const theta = deg(angle);

  return (
    <group position={[config.baseX, 1.05, 0]}>
      {/* MCP: 40% of the measured flexion */}
      <group rotation-x={theta * 0.4}>
        <FingerBone
          length={config.lengths[0]}
          radius={config.radii[0]}
          jointRadius={config.radii[0] * 1.1}
          jointScale={[1.1, 0.85, 1]}
        />

        {/* PIP: another 40% */}
        <group position={[0, config.lengths[0], 0]} rotation-x={theta * 0.4}>
          <FingerBone
            length={config.lengths[1]}
            radius={config.radii[1]}
            jointRadius={config.radii[1] * 1.1}
            jointScale={[1.1, 0.85, 1]}
          />

          {/* DIP: final 20% */}
          <group position={[0, config.lengths[1], 0]} rotation-x={theta * 0.2}>
            <FingerBone
              length={config.lengths[2]}
              radius={config.radii[2]}
              jointRadius={config.radii[2] * 1.1}
              jointScale={[1.1, 0.85, 1]}
              nail
            />
          </group>
        </group>
      </group>
    </group>
  );
}

function ThumbChain({ angle }: { angle: number }) {
  const theta = deg(angle);

  return (
    <group
      position={[-0.93, 0.08, 0.20]}
      rotation-z={deg(-35) + theta * 0.5}
    >
      <group rotation-x={theta * 0.5}>
        <FingerBone
          length={0.7}
          radius={0.11}
          jointRadius={0.12}
          jointScale={[1.1, 0.85, 1]}
        />

        <group position={[0, 0.7, 0]}>
          <FingerBone
            length={0.5}
            radius={0.09}
            jointRadius={0.10}
            jointScale={[1.1, 0.85, 1]}
            nail
          />
        </group>
      </group>
    </group>
  );
}

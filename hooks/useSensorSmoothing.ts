import { useCallback, useRef } from "react";
import * as THREE from "three";
import type { Fingers, WristRotation } from "@/types/sensor";

export interface SmoothedSensorState {
  fingers: Fingers;
  wrist: WristRotation;
  emg: number;
}

const INITIAL: SmoothedSensorState = {
  fingers: [74, 81, 76, 69, 22],
  wrist: { roll: 0, pitch: 0, yaw: 0 },
  emg: 42
};

export function useSensorSmoothing() {
  const current = useRef<SmoothedSensorState>({
    fingers: [...INITIAL.fingers] as Fingers,
    wrist: { ...INITIAL.wrist },
    emg: INITIAL.emg
  });

  const update = useCallback(
    (
      targetFingers: Fingers,
      targetWrist: WristRotation,
      targetEmg: number,
      delta: number
    ) => {
      // Frame-independent factor required by the RehabGrip specification.
      const factor = 1 - Math.pow(0.001, Math.max(0, delta));

      for (let i = 0; i < 5; i++) {
        current.current.fingers[i] = THREE.MathUtils.lerp(
          current.current.fingers[i],
          targetFingers[i],
          factor
        );
      }

      current.current.wrist.roll = THREE.MathUtils.lerp(
        current.current.wrist.roll,
        targetWrist.roll,
        factor
      );
      current.current.wrist.pitch = THREE.MathUtils.lerp(
        current.current.wrist.pitch,
        targetWrist.pitch,
        factor
      );
      current.current.wrist.yaw = THREE.MathUtils.lerp(
        current.current.wrist.yaw,
        targetWrist.yaw,
        factor
      );

      current.current.emg = THREE.MathUtils.lerp(
        current.current.emg,
        targetEmg,
        factor
      );

      return current.current;
    },
    []
  );

  const reset = useCallback(() => {
    current.current = {
      fingers: [...INITIAL.fingers] as Fingers,
      wrist: { ...INITIAL.wrist },
      emg: INITIAL.emg
    };
  }, []);

  return {
    current,
    update,
    reset
  };
}

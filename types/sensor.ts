export type Fingers = [number, number, number, number, number];

export interface SensorFrame {
  t: number;
  f: Fingers;
  e: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  bat: number;
}

export interface WristRotation {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface HandState {
  fingers: Fingers;
  emg: number;
  wristRoll: number;
  wristPitch: number;
  wristYaw: number;
  battery: number;
  connected: boolean;
  simMode: boolean;
  simValues: {
    fingers: Fingers;
    emg: number;
    roll: number;
    pitch: number;
    yaw: number;
  };
  repCount: number;
  targetReps: number;
  repHistory: ("correct" | "partial" | "missed")[];
  sessionStart: number | null;
  exerciseName: string;
  avgROM: number;
  consistency: number;
  emgSynced: boolean;
}
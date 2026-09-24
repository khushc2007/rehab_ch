import { create } from "zustand";
import type { Fingers, HandState, WristRotation } from "@/types/sensor";

export interface SimulationState {
  fingers: Fingers;
  emg: number;
  roll: number;
  pitch: number;
  yaw: number;
}

interface HandActions {
  setSimMode: (enabled: boolean) => void;
  setSimFinger: (index: number, value: number) => void;
  setSimAll: (value: number) => void;
  setSimEMG: (value: number) => void;
  setSimWrist: (
    axis: "roll" | "pitch" | "yaw",
    value: number
  ) => void;
  setBattery: (value: number) => void;
  setConnected: (connected: boolean) => void;
  setLive: (
    fingers: Fingers,
    emg: number,
    wrist: WristRotation,
    battery: number
  ) => void;
  incrementRep: (
    quality?: "correct" | "partial" | "missed"
  ) => void;
  resetSession: () => void;
  setSessionMetrics: (
    avgROM: number,
    consistency: number,
    emgSynced: boolean
  ) => void;
}

const DEFAULT_FINGERS: Fingers = [74, 81, 76, 69, 22];

const DEFAULT_SIMULATION: SimulationState = {
  fingers: [...DEFAULT_FINGERS] as Fingers,
  emg: 42,
  roll: 0,
  pitch: 0,
  yaw: 0
};

export const useHandStore = create<HandState & HandActions>(
  (set) => ({
    fingers: [...DEFAULT_FINGERS] as Fingers,
    emg: 42,
    wristRoll: 0,
    wristPitch: 0,
    wristYaw: 0,
    battery: 87,

    connected: false,
    simMode: true,

    simValues: {
      fingers: [...DEFAULT_SIMULATION.fingers] as Fingers,
      emg: DEFAULT_SIMULATION.emg,
      roll: DEFAULT_SIMULATION.roll,
      pitch: DEFAULT_SIMULATION.pitch,
      yaw: DEFAULT_SIMULATION.yaw
    },

    repCount: 7,
    targetReps: 10,
    repHistory: [
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "partial"
    ],

    sessionStart: Date.now(),
    exerciseName: "Finger Flexion",

    avgROM: 76,
    consistency: 89,
    emgSynced: true,

    setSimMode: (enabled) =>
      set((state) => ({
        simMode: enabled,
        connected: enabled ? false : state.connected,

        fingers: enabled
          ? [...state.simValues.fingers] as Fingers
          : state.fingers,

        emg: enabled ? state.simValues.emg : state.emg,

        wristRoll: enabled
          ? state.simValues.roll
          : state.wristRoll,

        wristPitch: enabled
          ? state.simValues.pitch
          : state.wristPitch,

        wristYaw: enabled
          ? state.simValues.yaw
          : state.wristYaw
      })),

    setSimFinger: (index, value) =>
      set((state) => {
        if (index < 0 || index > 4) return state;

        const fingers = [
          ...state.simValues.fingers
        ] as Fingers;

        fingers[index] = Math.max(0, Math.min(90, value));

        return {
          simValues: {
            ...state.simValues,
            fingers
          },
          ...(state.simMode
            ? { fingers }
            : {})
        };
      }),

    setSimAll: (value) =>
      set((state) => {
        const clamped = Math.max(0, Math.min(90, value));
        const fingers: Fingers = [
          clamped,
          clamped,
          clamped,
          clamped,
          clamped
        ];

        return {
          simValues: {
            ...state.simValues,
            fingers
          },
          ...(state.simMode
            ? { fingers }
            : {})
        };
      }),

    setSimEMG: (value) =>
      set((state) => {
        const emg = Math.max(0, Math.min(100, value));

        return {
          simValues: {
            ...state.simValues,
            emg
          },
          ...(state.simMode ? { emg } : {})
        };
      }),

    setSimWrist: (axis, value) =>
      set((state) => {
        const simValues = {
          ...state.simValues,
          [axis]: value
        };

        if (!state.simMode) {
          return { simValues };
        }

        if (axis === "roll") {
          return {
            simValues,
            wristRoll: value
          };
        }

        if (axis === "pitch") {
          return {
            simValues,
            wristPitch: value
          };
        }

        return {
          simValues,
          wristYaw: value
        };
      }),

    setBattery: (value) =>
      set({
        battery: Math.max(0, Math.min(100, value))
      }),

    setConnected: (connected) =>
      set({
        connected
      }),

    setLive: (fingers, emg, wrist, battery) =>
      set((state) => {
        if (state.simMode) return state;

        return {
          fingers: [...fingers] as Fingers,
          emg: Math.max(0, Math.min(100, emg)),
          wristRoll: wrist.roll,
          wristPitch: wrist.pitch,
          wristYaw: wrist.yaw,
          battery: Math.max(0, Math.min(100, battery)),
          connected: true
        };
      }),

    incrementRep: (quality = "correct") =>
      set((state) => ({
        repCount: Math.min(
          state.targetReps,
          state.repCount + 1
        ),
        repHistory: [
          ...state.repHistory,
          quality
        ]
      })),

    resetSession: () =>
      set({
        repCount: 0,
        repHistory: [],
        sessionStart: Date.now(),
        avgROM: 0,
        consistency: 0,
        emgSynced: false
      }),

    setSessionMetrics: (
      avgROM,
      consistency,
      emgSynced
    ) =>
      set({
        avgROM,
        consistency,
        emgSynced
      })
  })
);

 "use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useHandStore } from "@/store/handStore";
import type { Fingers } from "@/types/sensor";

type PresetName =
  | "OPEN"
  | "FIST"
  | "POINT"
  | "PEACE"
  | "PINCH"
  | "WAVE"
  | "FLEX 50%";

const PRESETS: Record<PresetName, Fingers> = {
  OPEN: [5, 5, 5, 5, 5],
  FIST: [90, 90, 90, 90, 85],
  POINT: [10, 80, 80, 80, 20],
  PEACE: [20, 75, 75, 20, 25],
  PINCH: [15, 35, 25, 20, 65],
  WAVE: [35, 60, 35, 60, 25],
  "FLEX 50%": [45, 45, 45, 45, 45]
};

const FINGER_NAMES = [
  "INDEX",
  "MIDDLE",
  "RING",
  "PINKY",
  "THUMB"
] as const;

export default function SimulationPanel() {
  const [expanded, setExpanded] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);
  const [addNoise, setAddNoise] = useState(false);

  const [speed, setSpeed] = useState(0.12);
  const [noiseLevel, setNoiseLevel] = useState(2);

  const simMode = useHandStore((state) => state.simMode);
  const values = useHandStore((state) => state.simValues);

  const setSimMode = useHandStore(
    (state) => state.setSimMode
  );
  const setSimFinger = useHandStore(
    (state) => state.setSimFinger
  );
  const setSimAll = useHandStore(
    (state) => state.setSimAll
  );
  const setSimEMG = useHandStore(
    (state) => state.setSimEMG
  );
  const setSimWrist = useHandStore(
    (state) => state.setSimWrist
  );

  const [noiseSeed, setNoiseSeed] = useState(0);

  useEffect(() => {
    if (!autoCycle || !simMode) return;

    const presetNames = Object.keys(
      PRESETS
    ) as PresetName[];

    let index = 0;

    const interval = window.setInterval(() => {
      const next = PRESETS[
        presetNames[index % presetNames.length]
      ];

      next.forEach((value, fingerIndex) => {
        setSimFinger(fingerIndex, value);
      });

      index += 1;
    }, 2000);

    return () => window.clearInterval(interval);
  }, [autoCycle, simMode, setSimFinger]);

  useEffect(() => {
    if (!addNoise || !simMode) return;

    const interval = window.setInterval(() => {
      setNoiseSeed((seed) => seed + 1);
    }, 50);

    return () => window.clearInterval(interval);
  }, [addNoise, simMode]);

  const noisyValues = useMemo(() => {
    if (!addNoise || !simMode) return values;

    const phase =
      Date.now() / 200 +
      noiseSeed * 0.01;

    const noise = (index: number) =>
      Math.sin(phase + index) * noiseLevel * 0.5 +
      (Math.random() - 0.5) * noiseLevel;

    return {
      ...values,
      fingers: values.fingers.map(
        (value, index) =>
          Math.max(
            0,
            Math.min(90, value + noise(index))
          )
      ) as Fingers,
      emg: Math.max(
        0,
        Math.min(100, values.emg + noise(8))
      )
    };
  }, [
    values,
    addNoise,
    simMode,
    noiseLevel,
    noiseSeed
  ]);

  // The simulation values in Zustand remain the authoritative slider state.
  // Noise is applied visually to the live simulation stream in SessionPage.
  void noisyValues;
  void speed;

  return (
    <>
      <button
        type="button"
        aria-label="Simulation controls"
        className="sim-key"
        onClick={() => setExpanded((value) => !value)}
      >
        ⌥
      </button>

      <motion.div
        initial={false}
        animate={{
          height: expanded ? 240 : 0,
          paddingTop: expanded ? 16 : 0,
          paddingBottom: expanded ? 16 : 0
        }}
        className="sim-panel"
      >
        <div className="sim-head">
          <span>SIMULATION</span>

          <button
            type="button"
            aria-label="Toggle simulation mode"
            className={
              simMode
                ? "toggle active"
                : "toggle"
            }
            onClick={() =>
              setSimMode(!simMode)
            }
          >
            <span />
          </button>

          <span className="sim-mode">
            {simMode
              ? "● SIM MODE"
              : "LIVE MODE"}
          </span>
        </div>

        <div className="slider-grid">
          <SimulationSlider
            label="ALL"
            value={values.fingers[0]}
            min={0}
            max={90}
            onChange={setSimAll}
          />

          {FINGER_NAMES.map((name, index) => (
            <SimulationSlider
              key={name}
              label={name}
              value={values.fingers[index]}
              min={0}
              max={90}
              onChange={(value) =>
                setSimFinger(index, value)
              }
            />
          ))}

          <SimulationSlider
            label="EMG"
            value={values.emg}
            min={0}
            max={100}
            onChange={setSimEMG}
          />

          <SimulationSlider
            label="ROLL"
            value={values.roll}
            min={-180}
            max={180}
            onChange={(value) =>
              setSimWrist("roll", value)
            }
          />

          <SimulationSlider
            label="PITCH"
            value={values.pitch}
            min={-90}
            max={90}
            onChange={(value) =>
              setSimWrist("pitch", value)
            }
          />

          <SimulationSlider
            label="YAW"
            value={values.yaw}
            min={-180}
            max={180}
            onChange={(value) =>
              setSimWrist("yaw", value)
            }
          />

          <SimulationSlider
            label="SPEED"
            value={speed}
            min={0.01}
            max={0.3}
            step={0.01}
            onChange={setSpeed}
            precision={2}
          />

          <SimulationSlider
            label="NOISE"
            value={noiseLevel}
            min={0}
            max={10}
            onChange={setNoiseLevel}
          />
        </div>

        <div className="preset-row">
          <span>PRESETS:</span>

          {(
            Object.keys(PRESETS) as PresetName[]
          ).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                PRESETS[name].forEach(
                  (value, index) =>
                    setSimFinger(index, value)
                );
              }}
            >
              {name}
            </button>
          ))}

          <label>
            <input
              type="checkbox"
              checked={autoCycle}
              onChange={(event) =>
                setAutoCycle(
                  event.target.checked
                )
              }
            />
            AUTO CYCLE
          </label>

          <label>
            <input
              type="checkbox"
              checked={addNoise}
              onChange={(event) =>
                setAddNoise(
                  event.target.checked
                )
              }
            />
            ADD NOISE
          </label>
        </div>
      </motion.div>
    </>
  );
}

function SimulationSlider({
  label,
  value,
  min,
  max,
  step = 1,
  precision = 0,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider">
      <span>{label}</span>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
      />

      <b>
        {value.toFixed(precision)}
      </b>
    </label>
  );
}

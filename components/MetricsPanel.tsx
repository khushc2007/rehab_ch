 "use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useHandStore } from "@/store/handStore";

const FINGER_NAMES = [
  "INDEX",
  "MIDDLE",
  "RING",
  "PINKY",
  "THUMB"
];

export default function MetricsPanel() {
  const fingers = useHandStore(
    (state) => state.fingers
  );
  const repCount = useHandStore(
    (state) => state.repCount
  );
  const targetReps = useHandStore(
    (state) => state.targetReps
  );
  const repHistory = useHandStore(
    (state) => state.repHistory
  );
  const avgROM = useHandStore(
    (state) => state.avgROM
  );
  const consistency = useHandStore(
    (state) => state.consistency
  );
  const emgSynced = useHandStore(
    (state) => state.emgSynced
  );
  const sessionStart = useHandStore(
    (state) => state.sessionStart
  );

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  useEffect(() => {
    const tick = () => {
      if (!sessionStart) {
        setElapsedSeconds(0);
        return;
      }

      setElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() - sessionStart) /
              1000
          )
        )
      );
    };

    tick();

    const id = window.setInterval(
      tick,
      1000
    );

    return () =>
      window.clearInterval(id);
  }, [sessionStart]);

  const elapsed = useMemo(
    () =>
      formatDuration(
        elapsedSeconds
      ),
    [elapsedSeconds]
  );

  const qualityCounts = useMemo(
    () => ({
      correct: repHistory.filter(
        (item) => item === "correct"
      ).length,
      partial: repHistory.filter(
        (item) => item === "partial"
      ).length,
      missed: repHistory.filter(
        (item) => item === "missed"
      ).length
    }),
    [repHistory]
  );

  return (
    <aside className="metrics">
      <div className="topbar">
        <span>FINGER FLEXION</span>
        <span>{elapsed}</span>
      </div>

      <section className="card rep-card">
        <div className="eyebrow">
          REP
        </div>

        <div>
          <span className="rep-number">
            {String(repCount).padStart(
              2,
              "0"
            )}
          </span>

          <span className="rep-target">
            {" "}
            / {targetReps}
          </span>
        </div>

        <div className="exercise">
          Finger Flexion
        </div>

        <div
          className="progress"
          aria-label="Rep progress"
        >
          <motion.div
            animate={{
              width: `${Math.min(
                100,
                (repCount /
                  Math.max(
                    1,
                    targetReps
                  )) *
                  100
              )}%`
            }}
            transition={{
              duration: 0.3
            }}
          />
        </div>

        <div className="quality">
          <span className="good">
            ● {qualityCounts.correct} correct
          </span>

          <span className="warn">
            ● {qualityCounts.partial} partial
          </span>

          <span className="bad">
            ● {qualityCounts.missed} missed
          </span>
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">
          FINGERS
        </div>

        <div className="finger-list">
          {fingers.map((angle, index) => (
            <FingerRow
              key={FINGER_NAMES[index]}
              name={FINGER_NAMES[index]}
              angle={angle}
            />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">
          SESSION METRICS
        </div>

        <div className="metric-grid">
          <Metric
            label="AVG ROM"
            value={`${Math.round(
              avgROM
            )}°`}
          />

          <Metric
            label="CONSISTENCY"
            value={`${Math.round(
              consistency
            )}%`}
          />

          <Metric
            label="MOVE TIME"
            value="1.2s"
          />

          <Metric
            label="EMG SYNC"
            value={
              emgSynced
                ? "✓ 94%"
                : "⚠ –"
            }
            good={emgSynced}
          />
        </div>
      </section>

      <section className="card emg-card">
        <div className="eyebrow">
          EMG ACTIVITY
        </div>

        <EMGSparkline />
      </section>

      <button
        type="button"
        className="end"
      >
        END SESSION
      </button>
    </aside>
  );
}

function FingerRow({
  name,
  angle
}: {
  name: string;
  angle: number;
}) {
  const statusColor =
    angle >= 65 && angle <= 85
      ? "#2ea853"
      : angle < 5
        ? "#555"
        : "#f5a623";

  return (
    <div className="finger-row">
      <span
        className="finger-status"
        style={{
          background: statusColor
        }}
      />

      <span className="finger-name">
        {name}
      </span>

      <div className="mini-bar">
        <motion.div
          animate={{
            width: `${Math.min(
              100,
              Math.max(0, angle / 90) *
                100
            )}%`
          }}
          transition={{
            duration: 0.1
          }}
        />
      </div>

      <span className="angle">
        {Math.round(angle)}°
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  good = false
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div
      className={
        good
          ? "metric good-cell"
          : "metric"
      }
    >
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function EMGSparkline() {
  const points = useMemo(() => {
    return Array.from(
      { length: 90 },
      (_, index) => {
        const envelope =
          24 +
          Math.sin(index * 0.37) * 8 +
          Math.sin(index * 1.7) * 3 +
          Math.sin(index * 0.08) * 4;

        return `${(
          (index / 89) *
          100
        ).toFixed(2)},${Math.max(
          2,
          Math.min(46, envelope)
        ).toFixed(2)}`;
      }
    ).join(" ");
  }, []);

  return (
    <svg
      viewBox="0 0 100 48"
      preserveAspectRatio="none"
      className="spark"
      aria-label="EMG activity"
    >
      <defs>
        <linearGradient
          id="emgFill"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#0F6E5E"
            stopOpacity="0.15"
          />
          <stop
            offset="100%"
            stopColor="#0F6E5E"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      <polyline
        points={`0,48 ${points} 100,48`}
        fill="url(#emgFill)"
        stroke="none"
      />

      <polyline
        points={points}
        fill="none"
        stroke="#0F6E5E"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remaining).padStart(2, "0")}`;
}

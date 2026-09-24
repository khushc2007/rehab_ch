import { useEffect, useRef } from "react";
import { useHandStore } from "@/store/handStore";
import type { SensorFrame, WristRotation } from "@/types/sensor";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "wss://localhost:3001/ws";

const MAX_ATTEMPTS = 10;
const MIN_RECONNECT_MS = 3000;
const MAX_RECONNECT_MS = 30000;

function calculateWristRotation(
  previous: WristRotation,
  frame: SensorFrame,
  dt: number
): WristRotation {
  const rollAccelerometer =
    Math.atan2(frame.ay, frame.az) * (180 / Math.PI);

  const pitchAccelerometer =
    Math.atan2(
      -frame.ax,
      Math.sqrt(frame.ay * frame.ay + frame.az * frame.az)
    ) * (180 / Math.PI);

  return {
    roll:
      0.96 * (previous.roll + frame.gx * dt) +
      0.04 * rollAccelerometer,

    pitch:
      0.96 * (previous.pitch + frame.gy * dt) +
      0.04 * pitchAccelerometer,

    yaw: previous.yaw + frame.gz * dt
  };
}

function sanitizeFrame(value: unknown): SensorFrame | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<SensorFrame>;

  if (
    typeof raw.t !== "number" ||
    !Array.isArray(raw.f) ||
    raw.f.length !== 5 ||
    typeof raw.e !== "number"
  ) {
    return null;
  }

  const numbers = [
    raw.t,
    ...raw.f,
    raw.e,
    raw.ax,
    raw.ay,
    raw.az,
    raw.gx,
    raw.gy,
    raw.gz,
    raw.bat
  ];

  if (numbers.some((n) => typeof n !== "number" || !Number.isFinite(n))) {
    return null;
  }

  return {
    t: raw.t,
    f: [
      Math.max(0, Math.min(90, raw.f[0])),
      Math.max(0, Math.min(90, raw.f[1])),
      Math.max(0, Math.min(90, raw.f[2])),
      Math.max(0, Math.min(90, raw.f[3])),
      Math.max(0, Math.min(90, raw.f[4]))
    ],
    e: Math.max(0, Math.min(100, raw.e)),
    ax: raw.ax!,
    ay: raw.ay!,
    az: raw.az!,
    gx: raw.gx!,
    gy: raw.gy!,
    gz: raw.gz!,
    bat: Math.max(0, Math.min(100, raw.bat!))
  };
}

export function useWebSocket(
  latestFrameRef: React.MutableRefObject<SensorFrame>
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const rotationRef = useRef<WristRotation>({
    roll: 0,
    pitch: 0,
    yaw: 0
  });

  const simMode = useHandStore((state) => state.simMode);

  useEffect(() => {
    if (simMode) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    let disposed = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed || useHandStore.getState().simMode) return;
      if (attemptsRef.current >= MAX_ATTEMPTS) return;

      const exponential =
        1000 * Math.pow(2, attemptsRef.current);

      const delay = Math.min(
        MAX_RECONNECT_MS,
        Math.max(MIN_RECONNECT_MS, exponential)
      );

      attemptsRef.current += 1;

      reconnectTimerRef.current = setTimeout(
        connect,
        delay
      );
    };

    const connect = () => {
      if (
        disposed ||
        useHandStore.getState().simMode ||
        socketRef.current?.readyState === WebSocket.OPEN
      ) {
        return;
      }

      let socket: WebSocket;

      try {
        socket = new WebSocket(WS_URL);
      } catch {
        useHandStore.getState().setConnected(false);
        scheduleReconnect();
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        attemptsRef.current = 0;
        lastTimestampRef.current = null;
        useHandStore.getState().setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const parsed: unknown = JSON.parse(event.data);
          const frame = sanitizeFrame(parsed);

          if (!frame) return;

          const previousTimestamp = lastTimestampRef.current;

          // Sensor timestamps are expected in milliseconds. Fall back to
          // a small frame interval for malformed/out-of-order timing.
          const dt =
            previousTimestamp === null
              ? 0.02
              : Math.min(
                  0.2,
                  Math.max(
                    0.001,
                    (frame.t - previousTimestamp) / 1000
                  )
                );

          lastTimestampRef.current = frame.t;

          rotationRef.current = calculateWristRotation(
            rotationRef.current,
            frame,
            dt
          );

          latestFrameRef.current = frame;

          const state = useHandStore.getState();

          // The frame is kept in a ref for the visual loop. Zustand receives
          // the live values for the slower clinical metrics/UI.
          state.setLive(
            frame.f,
            frame.e,
            rotationRef.current,
            frame.bat
          );
        } catch {
          // Malformed packets are ignored without interrupting the socket.
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        useHandStore.getState().setConnected(false);

        if (!disposed) {
          scheduleReconnect();
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      clearReconnect();
      socketRef.current?.close();
      socketRef.current = null;
      useHandStore.getState().setConnected(false);
    };
  }, [latestFrameRef, simMode]);
}

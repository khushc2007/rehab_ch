# RehabGrip Clinical Live Session

A clinical hand-rehabilitation monitoring interface for **RehabGrip**.

The live-session page is designed around a large anatomical-style 3D hand visualization and a compact clinical metrics panel. The implementation follows the supplied RehabGrip product specification.

## Technology

- Next.js 14
- React 18
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Tailwind CSS
- Zustand
- Framer Motion
- Native WebSocket client

## Project structure

```text
app/
  globals.css
  layout.tsx
  page.tsx

components/
  hand/
    HandScene.tsx
    HandModel.tsx
    FingerBone.tsx
    OrientationWidget.tsx
    ConnectionOverlay.tsx
  SimulationPanel.tsx
  MetricsPanel.tsx
  SessionPage.tsx

hooks/
  useWebSocket.ts
  useSensorSmoothing.ts
  useRepDetection.ts

store/
  handStore.ts

types/
  sensor.ts
```

## Requirements

- Node.js 18.17+ or Node.js 20+
- npm

## Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
npm start
```

## Simulation mode

The dashboard starts in simulation mode so the live session page can be demonstrated without an ESP32 connection.

The small `⌥` control in the bottom-left corner opens the simulation panel.

Available controls include:

- ALL finger flexion
- INDEX
- MIDDLE
- RING
- PINKY
- THUMB
- EMG
- ROLL
- PITCH
- YAW
- simulation speed
- noise level
- OPEN
- FIST
- POINT
- PEACE
- PINCH
- WAVE
- FLEX 50%
- AUTO CYCLE
- ADD NOISE

The simulation uses the same visual hand/rendering path as live telemetry.

## WebSocket connection

Create a local environment file:

```bash
cp .env.local.example .env.local
```

Then set:

```env
NEXT_PUBLIC_WS_URL=wss://your-render-app.onrender.com/ws
```

The frontend expects sensor messages in this shape:

```json
{
  "t": 1695123456789,
  "f": [74, 81, 76, 69, 22],
  "e": 42,
  "ax": 0.02,
  "ay": 0.98,
  "az": 0.01,
  "gx": -1.2,
  "gy": 0.4,
  "gz": 0.1,
  "bat": 87
}
```

### Sensor field mapping

```text
f[0] → index
f[1] → middle
f[2] → ring
f[3] → pinky
f[4] → thumb

e    → EMG level
ax   → accelerometer X
ay   → accelerometer Y
az   → accelerometer Z
gx   → gyroscope X
gy   → gyroscope Y
gz   → gyroscope Z
bat  → battery percentage
```

Finger flexion values are treated as degrees from `0–90`.

## Wrist orientation

The WebSocket hook integrates gyroscope values and applies the complementary-filter equations from the RehabGrip specification:

```text
roll  = .96 * (roll  + gx * dt) + .04 * atan2(ay, az)
pitch = .96 * (pitch + gy * dt) + .04 * atan2(-ax, sqrt(ay² + az²))
yaw   = yaw + gz * dt
```

The accelerometer-derived roll and pitch terms are converted to degrees.

## Reconnection behavior

The WebSocket client:

- reconnects automatically
- attempts reconnection for up to 10 attempts
- uses exponential backoff
- caps the delay at 30 seconds
- maintains the OFFLINE state when the connection is unavailable
- immediately stops the live socket when simulation mode is enabled

## 3D hand

The repository contains a procedural Three.js hand fallback.

The model uses:

- tapered cylindrical phalanges
- separate joint geometry
- proportional finger lengths
- thumb CMC/MCP articulation
- fingernails
- palm geometry
- forearm geometry
- wrist geometry
- clinical three-point lighting
- teal EMG illumination
- restricted orbit controls

A licensed high-fidelity GLTF hand can be integrated later by replacing the procedural `HandModel` implementation. No external hand asset is required for the current build.

## Visual design

The live session uses:

```text
Background: #0a0a0a
Metrics panel: #111111
Cards: #161616
Borders: #1f1f1f
Clinical teal: #0F6E5E
Primary text: #f0f0f0
Muted text: #555 / #666 / #888
```

The layout is:

```text
┌──────────────────────────────┬───────────────────┐
│                              │                   │
│                              │   REP             │
│       3D HAND                │   FINGERS         │
│                              │   METRICS         │
│                              │   EMG             │
│                              │                   │
└──────────────────────────────┴───────────────────┘
             70%                       30%
```

The main page intentionally has no normal page scrolling.

## Vercel deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Keep the framework as Next.js.
4. Add the following environment variable:

```text
NEXT_PUBLIC_WS_URL
```

5. Set its value to the production WebSocket endpoint.
6. Deploy.

The project uses the standard Next.js build:

```bash
next build
```

No Vercel-specific source modifications are required.

## Important production note

The supplied specification permits a procedural hand when a realistic GLTF asset is unavailable. The current repository therefore does not include a third-party anatomical model or texture asset.

For a production clinical product, any external anatomical mesh, texture, normal map, or medical visualization asset should be appropriately licensed before inclusion.

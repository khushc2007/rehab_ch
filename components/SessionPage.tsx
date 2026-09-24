 "use client";

import { useRef } from "react";
import HandScene from "@/components/hand/HandScene";
import MetricsPanel from "@/components/MetricsPanel";
import SimulationPanel from "@/components/SimulationPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { SensorFrame } from "@/types/sensor";

const initial:SensorFrame={t:Date.now(),f:[74,81,76,69,22],e:42,ax:0.02,ay:0.98,az:0.01,gx:-1.2,gy:.4,gz:.1,bat:87};

export default function SessionPage(){
  const latest=useRef<SensorFrame>(initial);
  useWebSocket(latest);
  return <main className="page"><section className="left"><HandScene/></section><MetricsPanel/><SimulationPanel/></main>
}
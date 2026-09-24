import { useRef } from "react";
import { useHandStore } from "@/store/handStore";

export function useRepDetection(angle: number) {
  const high = useRef(false);
  const increment = useHandStore(s => s.incrementRep);
  if (angle > 65) high.current = true;
  if (high.current && angle < 15) {
    high.current = false;
    increment("correct");
  }
}
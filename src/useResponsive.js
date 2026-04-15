import { useState, useEffect } from "react";
import { useStore } from "./store";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpArray(a, b, t) {
  return a.map((v, i) => lerp(v, b[i], t));
}

function interpolate(breakpoints, width) {
  const sorted = Object.keys(breakpoints)
    .map(Number)
    .sort((a, b) => a - b);

  // Clamp to lowest/highest
  if (width <= sorted[0]) return breakpoints[sorted[0]];
  if (width >= sorted[sorted.length - 1]) return breakpoints[sorted[sorted.length - 1]];

  // Find the two surrounding breakpoints
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (width >= sorted[i] && width <= sorted[i + 1]) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  const t = (width - lower) / (upper - lower);
  const a = breakpoints[lower];
  const b = breakpoints[upper];

  return {
    scale: lerp(a.scale, b.scale, t),
    cameraZ: lerp(a.cameraZ, b.cameraZ, t),
    position: lerpArray(a.position, b.position, t),
  };
}

export function useResponsive() {
  const responsive = useStore((s) => s.responsive);
  const [values, setValues] = useState(() =>
    interpolate(responsive, window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setValues(interpolate(responsive, window.innerWidth));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [responsive]);

  return values;
}

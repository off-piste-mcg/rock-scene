import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "./store";

export const isPerfEnabled =
  typeof window !== "undefined" && window.location.search.includes("perf");

const perfData = {
  fps: 0,
  frameMs: 0,
  minFps: 999,
  drawCalls: 0,
  triangles: 0,
  transitionMs: 0,
  transitionMinFps: 999,
  transitionActive: false,
};

const FRAME_WINDOW = 60;
const MIN_FPS_WINDOW_MS = 2000;
const TRANSITION_DURATION_MS = 5000;

export function PerfProbe() {
  const { gl } = useThree();
  const lastTime = useRef(performance.now());
  const frames = useRef([]);
  const recentFps = useRef([]);
  const transitionStart = useRef(null);
  const activeIndex = useStore((s) => s.activeIndex);
  const prevIndex = useRef(activeIndex);

  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      transitionStart.current = performance.now();
      perfData.transitionActive = true;
      perfData.transitionMinFps = 999;
      prevIndex.current = activeIndex;
    }
  }, [activeIndex]);

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTime.current;
    lastTime.current = now;

    frames.current.push(delta);
    if (frames.current.length > FRAME_WINDOW) frames.current.shift();
    const avgMs =
      frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
    const fps = 1000 / avgMs;

    recentFps.current.push({ t: now, fps });
    while (
      recentFps.current.length &&
      now - recentFps.current[0].t > MIN_FPS_WINDOW_MS
    ) {
      recentFps.current.shift();
    }
    const minFps = recentFps.current.reduce(
      (m, s) => Math.min(m, s.fps),
      999
    );

    perfData.fps = fps;
    perfData.frameMs = avgMs;
    perfData.minFps = minFps;
    perfData.drawCalls = gl.info.render.calls;
    perfData.triangles = gl.info.render.triangles;

    if (transitionStart.current !== null) {
      const elapsed = now - transitionStart.current;
      perfData.transitionMs = elapsed;
      perfData.transitionMinFps = Math.min(perfData.transitionMinFps, fps);
      if (elapsed > TRANSITION_DURATION_MS + 500) {
        transitionStart.current = null;
        perfData.transitionActive = false;
      }
    }
  });

  return null;
}

export function PerfOverlay() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const fmtTris = (n) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.72)",
        color: "#e8e8e8",
        font: "11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 9999,
        minWidth: 140,
        letterSpacing: 0.3,
      }}
    >
      <div>
        {perfData.fps.toFixed(0)} fps
        <span style={{ opacity: 0.55 }}>
          {"  "}min {perfData.minFps.toFixed(0)}
        </span>
      </div>
      <div style={{ opacity: 0.75 }}>{perfData.frameMs.toFixed(1)} ms/frame</div>
      <div style={{ opacity: 0.75 }}>
        draw {perfData.drawCalls} · tris {fmtTris(perfData.triangles)}
      </div>
      {perfData.transitionActive && (
        <div style={{ marginTop: 6, color: "#7ab7ff" }}>
          trans {(perfData.transitionMs / 1000).toFixed(1)}s
          <span style={{ opacity: 0.55 }}>
            {"  "}min {perfData.transitionMinFps.toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
}

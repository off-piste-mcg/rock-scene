import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import Rock from "./Rock";
import Flowers from "./Flowers";
import Environment from "./Environment";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
import "./App.css";

const isDev = window.location.hostname === "localhost";

const NAV_MAP = { entrance: 1, "1": 1, "2": 2, "3": 3 };

function NavListener() {
  const setActiveIndex = useStore((s) => s.setActiveIndex);

  useEffect(() => {
    const buttons = document.querySelectorAll("[data-nav]");
    const handler = (e) => {
      const nav = e.currentTarget.getAttribute("data-nav");
      const index = NAV_MAP[nav] ?? parseInt(nav, 10) - 1;
      if (!isNaN(index) && index >= 0) setActiveIndex(index);
    };
    buttons.forEach((btn) => btn.addEventListener("click", handler));
    return () => buttons.forEach((btn) => btn.removeEventListener("click", handler));
  }, [setActiveIndex]);

  return null;
}

function DevButtons() {
  const { rocks, activeIndex, setActiveIndex } = useStore();

  return (
    <div className="buttons">
      {rocks.map((_, i) => (
        <button
          key={i}
          className={i === activeIndex ? "active" : ""}
          onClick={() => setActiveIndex(i)}
        />
      ))}
    </div>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const { cameraZ } = useResponsive();
  const targetZ = useRef(cameraZ);

  targetZ.current = cameraZ;

  useFrame(() => {
    camera.position.z += (targetZ.current - camera.position.z) * 0.05;
  });

  return null;
}

function SceneGroup({ children }) {
  const groupRef = useRef();
  const { offset } = useResponsive();
  const target = useRef(offset);
  target.current = offset;

  useFrame(() => {
    const g = groupRef.current;
    g.position.x += (target.current[0] - g.position.x) * 0.05;
    g.position.y += (target.current[1] - g.position.y) * 0.05;
    g.position.z += (target.current[2] - g.position.z) * 0.05;
  });

  return <group ref={groupRef} position={offset}>{children}</group>;
}

function App() {
  const rockMeshRef = useRef();
  const [dpr, setDpr] = useState(1.5);

  return (
    <div id="app">
      <Canvas
        dpr={[1, dpr]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(1.5)}
          onDecline={() => setDpr(1)}
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
        <CameraRig />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1} />
        <SceneGroup>
          <Rock meshRefOut={rockMeshRef} />
          <Flowers rockRef={rockMeshRef} />
          <Rock reflection />
          <Flowers rockRef={rockMeshRef} reflection />
          <Environment />
        </SceneGroup>
      </Canvas>
      <NavListener />
      {isDev && <DevButtons />}
    </div>
  );
}

export default App;

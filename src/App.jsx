import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Rock from "./Rock";
import Environment from "./Environment";
import { useStore } from "./store";
import "./App.css";

function NavListener() {
  const setActiveIndex = useStore((s) => s.setActiveIndex);

  useEffect(() => {
    const buttons = document.querySelectorAll("[data-nav]");
    const handler = (e) => {
      const nav = e.currentTarget.getAttribute("data-nav");
      const index = parseInt(nav, 10) - 1; // data-nav="1" → index 0
      if (!isNaN(index)) setActiveIndex(index);
    };
    buttons.forEach((btn) => btn.addEventListener("click", handler));
    return () => buttons.forEach((btn) => btn.removeEventListener("click", handler));
  }, [setActiveIndex]);

  return null;
}

function App() {
  return (
    <div id="app">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1} />
        <Rock />
        <Rock reflection />
        <Environment />
      </Canvas>
      <NavListener />
    </div>
  );
}

export default App;

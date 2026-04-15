import { Canvas } from "@react-three/fiber";

import Rock from "./Rock";
import Environment from "./Environment";
import { useStore } from "./store";
import "./App.css";

function App() {
  const { states, activeIndex, setActiveIndex } = useStore();

  return (
    <div id="app">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <directionalLight position={[-5, 3, -5]} intensity={1} />
        <Rock />
        <Rock reflection />
        <Environment />

      </Canvas>

      <div className="buttons">
        {states.map((state, i) => (
          <button
            key={i}
            className={i === activeIndex ? "active" : ""}
            style={{ backgroundColor: state.color }}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;

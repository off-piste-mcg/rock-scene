import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useStore } from "./store";
import gsap from "gsap";
import "./GrowMaterial";

const texturePaths = [
  "/textures/tmc_off_piste_black rock 4096x4096 albedo.png",
  "/textures/tmc_off_piste_black rock 4096x4096 beauty.png",
  "/textures/tmc_off_piste_black rock 4096x4096 normals.png",
];

export default function Rock({ reflection = false }) {
  const matRef = useRef();
  const meshRef = useRef();
  const { activeIndex } = useStore();
  const prevIndex = useRef(activeIndex);
  const transitioning = useRef(false);

  const gltf = useLoader(GLTFLoader, "/models/rock.gltf");
  let geometry = null;
  gltf.scene.traverse((child) => {
    if (child.isMesh && !geometry) geometry = child.geometry;
  });

  const textures = useTexture(texturePaths);
  textures.forEach((t) => {
    t.flipY = false;
    t.needsUpdate = true;
  });
  const lightmask = useTexture("/textures/lightmask.png");
  const baseOpacity = reflection ? 0.25 : 1;

  useFrame(() => {
    meshRef.current.rotation.y += 0.003;

    if (prevIndex.current !== activeIndex && !transitioning.current) {
      transitioning.current = true;
      const mat = matRef.current;
      mat.uTexture2 = textures[activeIndex];
      mat.uProgress = 0;

      gsap.to(mat, {
        uProgress: 1,
        duration: 5,
        ease: "power1.inOut",
        onComplete: () => {
          mat.uTexture1 = textures[activeIndex];
          mat.uProgress = 0;
          prevIndex.current = activeIndex;
          transitioning.current = false;
        },
      });
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={reflection ? [0, -2.5, 0] : [0, 0.5, 0]}
      scale={reflection ? [1, -1, 1] : [1, 1, 1]}
      renderOrder={reflection ? 0 : 2}
    >
      <growMaterial
        ref={matRef}
        uTexture1={textures[0]}
        uTexture2={textures[0]}
        uLightmask={lightmask}
        uProgress={0}
        uOpacity={baseOpacity}
        transparent
        depthWrite={!reflection}
      />
    </mesh>
  );
}

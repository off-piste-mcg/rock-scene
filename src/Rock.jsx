import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useStore } from "./store";
import gsap from "gsap";
import "./GrowMaterial";

export default function Rock({ reflection = false }) {
  const matRef = useRef();
  const meshRef = useRef();
  const { activeIndex, rocks, assetBaseUrl } = useStore();
  const prevIndex = useRef(activeIndex);
  const transitioning = useRef(false);

  const base = assetBaseUrl;
  const gltf = useLoader(GLTFLoader, `${base}/models/rock.glb`, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);
  });
  let geometry = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((child) => {
    if (child.isMesh && !geometry) {
      geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
    }
  });

  // Load all rock textures upfront
  const allTextures = useTexture(rocks.map((r) => `${base}${r.texture}`));
  allTextures.forEach((t) => {
    t.flipY = false;
    t.needsUpdate = true;
  });

  // Load all projections upfront
  const allProjections = useTexture(rocks.map((r) => `${base}${r.projection}`));

  const baseOpacity = reflection ? 0.25 : 1;

  useFrame(({ clock }) => {
    meshRef.current.rotation.y += 0.003;
    matRef.current.uTime = clock.getElapsedTime();

    if (prevIndex.current !== activeIndex && !transitioning.current) {
      transitioning.current = true;
      const mat = matRef.current;
      mat.uTexture2 = allTextures[activeIndex];
      mat.uLightmaskNext = allProjections[activeIndex];
      mat.uProgress = 0;

      gsap.to(mat, {
        uProgress: 1,
        duration: 5,
        ease: "power1.inOut",
        onComplete: () => {
          mat.uTexture1 = allTextures[activeIndex];
          mat.uLightmask = allProjections[activeIndex];
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
      rotation={[0, 0, 0]}
      renderOrder={reflection ? 0 : 2}
    >
      <growMaterial
        ref={matRef}
        uTexture1={allTextures[0]}
        uTexture2={allTextures[0]}
        uLightmask={allProjections[0]}
        uLightmaskNext={allProjections[0]}
        uProgress={0}
        uTime={0}
        uOpacity={baseOpacity}
        transparent
        depthWrite={!reflection}
      />
    </mesh>
  );
}

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
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
  const { scale: rScale, position: rPosition } = useResponsive();
  const targetScale = useRef(rScale);
  const targetPos = useRef(rPosition);
  targetScale.current = rScale;
  targetPos.current = rPosition;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    // Smooth lerp toward responsive targets
    const s = reflection ? targetScale.current : targetScale.current;
    mesh.scale.x += (s - mesh.scale.x) * 0.05;
    mesh.scale.y += ((reflection ? -s : s) - mesh.scale.y) * 0.05;
    mesh.scale.z += (s - mesh.scale.z) * 0.05;

    const ty = reflection
      ? targetPos.current[1] - 3
      : targetPos.current[1];
    mesh.position.x += (targetPos.current[0] - mesh.position.x) * 0.05;
    mesh.position.y += (ty - mesh.position.y) * 0.05;
    mesh.position.z += (targetPos.current[2] - mesh.position.z) * 0.05;

    mesh.rotation.y += 0.003;
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
      position={reflection ? [rPosition[0], rPosition[1] - 3, rPosition[2]] : rPosition}
      scale={reflection ? [rScale, -rScale, rScale] : [rScale, rScale, rScale]}
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

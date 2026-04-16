import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
import gsap from "gsap";
import "./GrowMaterial";

export default function Rock({ reflection = false, meshRefOut }) {
  const matRef = useRef();
  const meshRef = useRef();
  const { activeIndex, rocks, assetBaseUrl } = useStore();
  const prevIndex = useRef(activeIndex);
  const activeTween = useRef(null);

  const base = assetBaseUrl;
  const gltf = useLoader(GLTFLoader, `${base}/models/rock.glb`, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);
  });
  const geometry = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    let geo = null;
    gltf.scene.traverse((child) => {
      if (child.isMesh && !geo) {
        geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
      }
    });
    return geo;
  }, [gltf]);

  // Load all rock textures upfront
  const allTextures = useTexture(rocks.map((r) => `${base}${r.texture}`));
  useMemo(() => {
    allTextures.forEach((t) => {
      t.flipY = false;
      t.needsUpdate = true;
    });
  }, [allTextures]);

  // Load all projections upfront
  const allProjections = useTexture(rocks.map((r) => `${base}${r.projection}`));

  const baseOpacity = reflection ? 0.25 : 1;
  const { scale: rScale, offset } = useResponsive();
  const targetScale = useRef(rScale);
  targetScale.current = rScale;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    // Smooth lerp toward responsive scale
    const s = targetScale.current;
    mesh.scale.x += (s - mesh.scale.x) * 0.05;
    mesh.scale.y += ((reflection ? -s : s) - mesh.scale.y) * 0.05;
    mesh.scale.z += (s - mesh.scale.z) * 0.05;

    mesh.rotation.y += 0.003;
    if (meshRefOut) meshRefOut.current = mesh;
    matRef.current.uTime = clock.getElapsedTime();

    if (prevIndex.current !== activeIndex) {
      const mat = matRef.current;

      if (activeTween.current) {
        activeTween.current.kill();
        mat.uTexture1 = allTextures[prevIndex.current];
        mat.uLightmask = allProjections[prevIndex.current];
        mat.uProgress = 0;
      }

      mat.uTexture2 = allTextures[activeIndex];
      mat.uLightmaskNext = allProjections[activeIndex];
      mat.uProgress = 0;
      prevIndex.current = activeIndex;

      activeTween.current = gsap.to(mat, {
        uProgress: 1,
        duration: 5,
        ease: "power1.inOut",
        onComplete: () => {
          mat.uTexture1 = allTextures[activeIndex];
          mat.uLightmask = allProjections[activeIndex];
          mat.uProgress = 0;
          activeTween.current = null;
        },
      });
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={reflection ? [0, -3.5, 0] : [0, 0.5, 0]}
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
        uOffset={offset}
        transparent
        depthWrite={!reflection}
      />
    </mesh>
  );
}

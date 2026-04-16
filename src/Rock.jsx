import { useRef, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
import gsap from "gsap";
import "./GrowMaterial";

export default function Rock({ reflection = false, meshRefOut }) {
  const matRef = useRef();
  const meshRef = useRef();
  const activeIndex = useStore((s) => s.activeIndex);
  const rocks = useStore((s) => s.rocks);
  const assetBaseUrl = useStore((s) => s.assetBaseUrl);
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

  // Load all rock textures as KTX2
  const { gl } = useThree();
  const allTextures = useLoader(KTX2Loader, rocks.map((r) => `${base}${r.texture}`), (loader) => {
    loader.setTranscoderPath("https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/");
    loader.detectSupport(gl);
  });
  useMemo(() => {
    allTextures.forEach((t) => {
      t.flipY = false;
      t.colorSpace = "";
      t.needsUpdate = true;
    });
  }, [allTextures]);

  // Load all projections as KTX2
  const allProjections = useLoader(KTX2Loader, rocks.map((r) => `${base}${r.projection}`), (loader) => {
    loader.setTranscoderPath("https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/");
    loader.detectSupport(gl);
  });

  const baseOpacity = reflection ? 0.25 : 1;
  const { scale: rScale, offset } = useResponsive();
  const targetScale = useRef(rScale);
  targetScale.current = rScale;

  // Entrance animation — fade in from behind on first mount
  const entered = useRef(false);
  const introProgress = useRef({ opacity: 0, z: -2 });
  useMemo(() => {
    if (!entered.current) {
      entered.current = true;
      gsap.to(introProgress.current, {
        opacity: 1,
        z: 0,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.3,
      });
    }
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    // Smooth lerp toward responsive scale
    const s = targetScale.current;
    mesh.scale.x += (s - mesh.scale.x) * 0.05;
    mesh.scale.y += ((reflection ? -s : s) - mesh.scale.y) * 0.05;
    mesh.scale.z += (s - mesh.scale.z) * 0.05;

    // Apply intro offset
    mesh.position.z = introProgress.current.z;

    mesh.rotation.y += 0.003;
    if (meshRefOut) meshRefOut.current = mesh;
    matRef.current.uTime = clock.getElapsedTime();
    matRef.current.uOpacity = baseOpacity * introProgress.current.opacity;

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

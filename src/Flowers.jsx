import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import gsap from "gsap";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
import "./FlowerMaterial";

// mesh name → texture file mapping
const MESH_TEXTURES = {
  grass01: "/textures/flowers+grass03_edit_03_grass_edit_grass01_beauty.png",
  grass02: "/textures/flowers+grass03_edit_03_grass_edit_grass02_beauty.png",
  grass03: "/textures/flowers+grass03_edit_03_grass_edit_grass03_beauty.png",
  tempest01: "/textures/flowers+grass03_edit_03_flowers_edit_tempest01_beauty.png",
  tempest02: "/textures/flowers+grass03_edit_03_flowers_edit_tempest02_beauty.png",
  tempest03: "/textures/flowers+grass03_edit_03_flowers_edit_tempest03_beauty.png",
  daisy01: "/textures/flowers+grass03_edit_03_flowers_edit_daisy01_beauty.png",
  daisy02: "/textures/flowers+grass03_edit_03_flowers_edit_daisy02_beauty.png",
  daisy03: "/textures/flowers+grass03_edit_03_flowers_edit_daisy03_beauty.png",
};

export default function Flowers({ rockRef, reflection = false }) {
  const groupRef = useRef();
  const materialsRef = useRef([]);
  const { assetBaseUrl } = useStore();
  const { scale: rScale } = useResponsive();
  const base = assetBaseUrl;
  const prevIndex = useRef(0);
  const progressRef = useRef({ value: 1 }); // start dissolved (entrance is not Info)
  const transitioning = useRef(false);

  const gltf = useLoader(GLTFLoader, `${base}/models/flowers.glb`, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);
  });

  const texturePaths = Object.values(MESH_TEXTURES).map((t) => `${base}${t}`);
  const textureArray = useTexture(texturePaths);
  const textureMap = useMemo(() => {
    const map = {};
    const keys = Object.keys(MESH_TEXTURES);
    keys.forEach((key, i) => {
      textureArray[i].flipY = false;
      textureArray[i].needsUpdate = true;
      map[key] = textureArray[i];
    });
    return map;
  }, [textureArray]);

  const meshes = useMemo(() => {
    const result = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (child.isMesh && MESH_TEXTURES[child.name]) {
        const geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
        result.push({ name: child.name, geometry: geo });
      }
    });
    return result;
  }, [gltf]);

  useFrame(({ clock }) => {
    if (rockRef?.current && groupRef.current) {
      groupRef.current.rotation.y = rockRef.current.rotation.y;
    }

    const currentIndex = useStore.getState().activeIndex;

    // Trigger transition when activeIndex changes
    if (prevIndex.current !== currentIndex && !transitioning.current) {
      transitioning.current = true;
      const shouldShow = currentIndex === 1; // only on Info rock

      gsap.to(progressRef.current, {
        value: shouldShow ? 0 : 1,
        duration: 5,
        ease: "power1.inOut",
        onComplete: () => {
          prevIndex.current = currentIndex;
          transitioning.current = false;
        },
      });
    }

    materialsRef.current.forEach((mat) => {
      if (mat) {
        mat.uProgress = progressRef.current.value;
        mat.uTime = clock.getElapsedTime();
      }
    });
  });

  const yPos = reflection ? -3.5 : 0.5;
  const yScale = reflection ? -rScale : rScale;
  const opacity = reflection ? 0.25 : 1;

  return (
    <group ref={groupRef} position={[0, yPos, 0]} scale={[rScale, yScale, rScale]}>
      {meshes.map((m, i) => (
        <mesh key={m.name} geometry={m.geometry} renderOrder={reflection ? 0 : 3}>
          <flowerMaterial
            ref={(el) => (materialsRef.current[i] = el)}
            uTexture={textureMap[m.name]}
            uEmissiveBoost={reflection ? 0.2 : 0.5}
            uOpacity={opacity}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

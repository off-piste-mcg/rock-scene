import { useRef, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import gsap from "gsap";
import { useStore } from "./store";
import { useResponsive } from "./useResponsive";
import "./FlowerMaterial";

// mesh name → texture file mapping
const MESH_TEXTURES = {
  grass01: "/textures/flowers+grass03_edit_03_grass_edit_grass01_beauty.ktx2",
  grass02: "/textures/flowers+grass03_edit_03_grass_edit_grass02_beauty.ktx2",
  grass03: "/textures/flowers+grass03_edit_03_grass_edit_grass03_beauty.ktx2",
  tempest01: "/textures/flowers+grass03_edit_03_flowers_edit_tempest01_beauty.ktx2",
  tempest02: "/textures/flowers+grass03_edit_03_flowers_edit_tempest02_beauty.ktx2",
  tempest03: "/textures/flowers+grass03_edit_03_flowers_edit_tempest03_beauty.ktx2",
  daisy01: "/textures/flowers+grass03_edit_03_flowers_edit_daisy01_beauty.ktx2",
  daisy02: "/textures/flowers+grass03_edit_03_flowers_edit_daisy02_beauty.ktx2",
  daisy03: "/textures/flowers+grass03_edit_03_flowers_edit_daisy03_beauty.ktx2",
};

export default function Flowers({ rockRef, reflection = false }) {
  const groupRef = useRef();
  const materialsRef = useRef([]);
  const assetBaseUrl = useStore((s) => s.assetBaseUrl);
  const { scale: rScale, reflectionY } = useResponsive();
  const base = assetBaseUrl;
  const prevIndex = useRef(0);
  const progressRef = useRef({ value: 1 }); // start dissolved (entrance is not Info)
  const activeTween = useRef(null);

  const gltf = useLoader(GLTFLoader, `${base}/models/flowers.glb`, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);
  });

  const { gl } = useThree();
  const texturePaths = Object.values(MESH_TEXTURES).map((t) => `${base}${t}`);
  const textureArray = useLoader(KTX2Loader, texturePaths, (loader) => {
    loader.setTranscoderPath("https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/");
    loader.detectSupport(gl);
  });
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
    if (prevIndex.current !== currentIndex) {
      if (activeTween.current) activeTween.current.kill();

      prevIndex.current = currentIndex;
      const shouldShow = currentIndex === 1; // only on Info rock

      activeTween.current = gsap.to(progressRef.current, {
        value: shouldShow ? 0 : 1,
        duration: 5,
        ease: "power1.inOut",
        onComplete: () => {
          activeTween.current = null;
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

  const yPos = reflection ? reflectionY : 0.5;
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

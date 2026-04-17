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
  const rocks = useStore((s) => s.rocks);
  const { scale: rScale, reflectionY, offset } = useResponsive();
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
  // Reuse the Info rock's projection on the flowers so the text lands on top.
  // useLoader caches by URL, so no double download — Rock already loaded this.
  const infoProjection = useLoader(
    KTX2Loader,
    `${base}${rocks[1].projection}`,
    (loader) => {
      loader.setTranscoderPath("https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/");
      loader.detectSupport(gl);
    }
  );
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

    // Hide group when fully dissolved — skip 9 draw calls + 440K verts
    if (groupRef.current) {
      groupRef.current.visible = progressRef.current.value < 0.99;
    }

    materialsRef.current.forEach((mat) => {
      if (mat) {
        mat.uProgress = progressRef.current.value;
        mat.uTime = clock.getElapsedTime();
      }
    });
  });

  // Overall bush size. Lower = smaller and automatically denser (duplicates
  // cluster tighter). Higher = bigger, spreads further up the rock.
  const FLOWER_SCALE = 1.0;

  // Duplicate each mesh to densify the bush. Each entry = one copy.
  // rotY (radians) = angular offset around rock Y-axis; tight = keeps
  // duplicates on the same side of the rock.
  // radial < 1 pulls duplicates inward toward the rock's vertical axis —
  // compensates for the rock not being a perfect cylinder, so rotated
  // duplicates sink into the surface instead of floating in air.
  // yOffset = small vertical variance.
  const DUPES = [
    { rotY: 0.0,  yOffset: 0.0,    radial: 1.0  },
    { rotY: -0.07, yOffset: 0.02,  radial: 0.96 },
    { rotY: 0.07,  yOffset: -0.015, radial: 0.96 },
  ];

  const yPos = reflection ? reflectionY : 0.5;
  const sx = rScale * FLOWER_SCALE;
  const sy = (reflection ? -rScale : rScale) * FLOWER_SCALE;
  const darken = reflection ? 0.25 : 1;

  return (
    <group ref={groupRef} position={[0, yPos, 0]} scale={[sx, sy, sx]}>
      {meshes.map((m, i) =>
        DUPES.map((d, j) => {
          const flatIndex = i * DUPES.length + j;
          return (
            <mesh
              key={`${m.name}-${j}`}
              geometry={m.geometry}
              rotation={[0, d.rotY, 0]}
              position={[0, d.yOffset, 0]}
              scale={[d.radial, 1, d.radial]}
              renderOrder={reflection ? -1 : 3}
            >
              <flowerMaterial
                ref={(el) => (materialsRef.current[flatIndex] = el)}
                uTexture={textureMap[m.name]}
                uLightmask={infoProjection}
                uLightmaskNext={infoProjection}
                uOffset={offset}
                uEmissiveBoost={reflection ? 0.4 : 1.0}
                uOpacity={1}
                uDarken={darken}
                transparent={!reflection}
                depthWrite={reflection}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

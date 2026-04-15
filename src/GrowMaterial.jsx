import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { noise3D } from "./shaderNoise";

const GrowMaterial = shaderMaterial(
  {
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
    uLightmask: new THREE.Texture(),
    uLightmaskNext: new THREE.Texture(),
    uProgress: 0,
    uOpacity: 1,
    uTime: 0,
    uOffset: new THREE.Vector3(0, 0, 0),
  },
  // vertex
  `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec4 vScreenPos;
    varying vec3 vViewNormal;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vPos = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
      // use world-space Z so the spread always starts from the front
      // regardless of rock rotation
      float worldZ = worldPos.z;
      vDepth = (-worldZ + 1.0) * 0.5; // 0 = front (camera side), 1 = back
      vViewNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewPos;
      vScreenPos = gl_Position;
    }
  `,
  // fragment
  `
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform sampler2D uLightmask;
    uniform sampler2D uLightmaskNext;
    uniform float uProgress;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uOffset;
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec4 vScreenPos;
    varying vec3 vViewNormal;
    varying vec3 vWorldPos;

    ${noise3D}

    void main() {
      vec4 t1 = texture2D(uTexture1, vUv);
      vec4 t2 = texture2D(uTexture2, vUv);

      // --- lighting for glossy dark rock ---
      vec3 N = normalize(vViewNormal);
      vec3 viewDir = vec3(0.0, 0.0, 1.0);

      // key light (top-right-front)
      vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.6));
      float diff1 = max(0.0, dot(N, lightDir1));

      // fill light (left)
      vec3 lightDir2 = normalize(vec3(-0.6, 0.3, 0.4));
      float diff2 = max(0.0, dot(N, lightDir2));

      // back light
      vec3 lightDir3 = normalize(vec3(0.0, 0.2, -0.8));
      float diff3 = max(0.0, dot(N, lightDir3));

      // rim light — highlights silhouette edges
      float rim = 1.0 - max(0.0, dot(N, viewDir));
      rim = pow(rim, 2.5) * 0.5;

      float diffuse = 0.4 + diff1 * 0.8 + diff2 * 0.4 + diff3 * 0.3;
      float lighting = diffuse + rim;

      // --- lightmask projection with glitch ---
      vec3 localWorldPos = vWorldPos - uOffset;
      vec2 projUv = localWorldPos.xy * 0.4 + vec2(0.4, 0.3);

      // glitch: random horizontal shifts per scanline
      float scanline = floor(projUv.y * 40.0);
      float glitchRand = fract(sin(scanline * 43.7 + floor(uTime * 30.0) * 17.3) * 4375.5);
      float glitchStrength = smoothstep(0.7, 1.0, glitchRand);

      // intense glitch during transition
      float transitionGlitch = uProgress * (1.0 - uProgress) * 4.0; // peaks at 0.5
      glitchStrength *= transitionGlitch * 6.0;

      vec2 glitchedUv = projUv;
      glitchedUv.x += glitchStrength * 0.06 * (glitchRand - 0.5);

      // sample both current and next projection
      vec4 lmCurrent = texture2D(uLightmask, glitchedUv);
      vec4 lmNext = texture2D(uLightmaskNext, glitchedUv);

      // hard snap between projections mid-transition
      vec4 lm = mix(lmCurrent, lmNext, step(0.5, uProgress));

      // heavy flicker during transition — projection cutting in and out
      float flicker = 1.0 - transitionGlitch * step(0.6, glitchRand);

      float facing = max(0.0, N.z);
      float attenuation = smoothstep(0.0, 0.4, facing) * flicker;
      lm.rgb *= attenuation;

      // hard cutoff: show nothing of texture2 when progress is 0
      if (uProgress < 0.001) {
        vec3 lit = t1.rgb * diffuse + vec3(rim);
        gl_FragColor = vec4(lit + lm.rgb, t1.a * uOpacity);
        return;
      }

      // directional spread: starts from face closest to camera, crawls to back
      float directional = vDepth; // 0 = facing camera, 1 = away

      // 3D noise for organic tendrils — continuous across faces
      float n = fbm3(vPos * 3.0) * 0.5 + 0.5;

      // combine direction + noise
      float threshold = directional * 0.65 + (1.0 - n) * 0.35;

      // spread with overshoot to fully cover
      float spread = uProgress * 1.3 + 0.1;

      // organic edge
      float mask = 1.0 - smoothstep(spread - 0.02, spread + 0.02, threshold);

      // infected edge glow
      float edgeDist = abs(threshold - spread);
      float edgeGlow = smoothstep(0.06, 0.0, edgeDist) * step(uProgress, 0.99);
      vec3 glowColor = vec3(0.0, 0.16, 0.69);

      vec4 color = mix(t1, t2, mask);
      color.rgb = color.rgb * diffuse + vec3(rim);
      color.rgb += glowColor * edgeGlow * 0.6;
      color.rgb += lm.rgb;

      color.a *= uOpacity;
      gl_FragColor = color;
    }
  `
);

extend({ GrowMaterial });

export default GrowMaterial;

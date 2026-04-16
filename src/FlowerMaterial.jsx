import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { noise3D } from "./shaderNoise";

const FlowerMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uProgress: 0,
    uTime: 0,
    uEmissiveBoost: 0.5,
    uOpacity: 1,
    uDarken: 1.0,
  },
  // vertex
  `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec3 vViewNormal;
    void main() {
      vUv = uv;
      vPos = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
      float worldZ = worldPos.z;
      vDepth = (-worldZ + 1.0) * 0.5;
      vViewNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewPos;
    }
  `,
  // fragment
  `
    uniform sampler2D uTexture;
    uniform float uProgress;
    uniform float uTime;
    uniform float uEmissiveBoost;
    uniform float uOpacity;
    uniform float uDarken;
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec3 vViewNormal;

    ${noise3D}

    void main() {
      vec4 tex = texture2D(uTexture, vUv);

      // simple lighting
      vec3 N = normalize(vViewNormal);
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
      float diff = max(0.0, dot(N, lightDir)) * 0.6 + 0.4;

      // brighten with emissive boost
      vec3 col = tex.rgb * diff + tex.rgb * uEmissiveBoost;

      col *= uDarken;

      // when fully visible (progress = 0), just show the flowers
      if (uProgress < 0.001) {
        gl_FragColor = vec4(col, tex.a * uOpacity);
        return;
      }

      // glitch dissolve out — inverted from rock (mask=0 means visible here)
      float directional = vDepth;
      float n = fbm3(vPos * 3.0) * 0.5 + 0.5;
      float threshold = directional * 0.65 + (1.0 - n) * 0.35;
      float spread = uProgress * 1.3 + 0.1;
      float dissolve = smoothstep(spread - 0.02, spread + 0.02, threshold);

      // edge glow — fade in smoothly at start
      float edgeDist = abs(threshold - spread);
      float fadeIn = smoothstep(0.0, 0.08, uProgress);
      float edgeGlow = smoothstep(0.06, 0.0, edgeDist) * step(uProgress, 0.99) * fadeIn;
      vec3 glowColor = vec3(0.0, 0.16, 0.69);

      col += glowColor * edgeGlow * 0.6 * fadeIn;

      // discard dissolved pixels
      float alpha = tex.a * dissolve * uOpacity;
      if (alpha < 0.01) discard;

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ FlowerMaterial });

export default FlowerMaterial;

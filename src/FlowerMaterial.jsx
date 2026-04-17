import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { noise3D } from "./shaderNoise";

const FlowerMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uLightmask: new THREE.Texture(),
    uLightmaskNext: new THREE.Texture(),
    uProgress: 0,
    uTime: 0,
    uEmissiveBoost: 0.5,
    uOpacity: 1,
    uDarken: 1.0,
    uOffset: new THREE.Vector3(0, 0, 0),
  },
  // vertex
  `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec3 vViewNormal;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vPos = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
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
    uniform sampler2D uLightmask;
    uniform sampler2D uLightmaskNext;
    uniform float uProgress;
    uniform float uTime;
    uniform float uEmissiveBoost;
    uniform float uOpacity;
    uniform float uDarken;
    uniform vec3 uOffset;
    varying vec2 vUv;
    varying vec3 vPos;
    varying float vDepth;
    varying vec3 vViewNormal;
    varying vec3 vWorldPos;

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

      // saturation boost — push colors away from gray. >1.0 = more saturated.
      // Makes the blue flowers pop without distorting hue.
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, 1.35);

      // --- projection overlay (same math as GrowMaterial so the light lands
      // on flowers at the same screen position it lands on the rock) ---
      vec3 localWorldPos = vWorldPos - uOffset;
      vec2 projUv = vec2(localWorldPos.x, -localWorldPos.y) * 0.4 + vec2(0.4, 0.65);
      float scanline = floor(projUv.y * 40.0);
      float glitchRand = fract(sin(scanline * 43.7 + floor(uTime * 30.0) * 17.3) * 4375.5);
      float glitchStrength = smoothstep(0.7, 1.0, glitchRand);
      float transitionGlitch = uProgress * (1.0 - uProgress) * 4.0;
      glitchStrength *= transitionGlitch * 6.0;
      vec2 glitchedUv = projUv;
      glitchedUv.x += glitchStrength * 0.06 * (glitchRand - 0.5);
      vec4 lmCurrent = texture2D(uLightmask, glitchedUv);
      vec4 lmNext = texture2D(uLightmaskNext, glitchedUv);
      vec4 lm = mix(lmCurrent, lmNext, step(0.5, uProgress));
      float flicker = 1.0 - transitionGlitch * step(0.6, glitchRand);
      float facing = max(0.0, N.z);
      float attenuation = smoothstep(0.0, 0.4, facing) * flicker;
      lm.rgb *= attenuation;
      col += lm.rgb;

      // when fully visible (progress = 0), just show the flowers
      if (uProgress < 0.001) {
        // discard empty regions of the flower texture so they don't render
        // as opaque rectangles (important for the reflection where
        // transparent=false and alpha blending is off).
        if (tex.a < 0.01) discard;
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

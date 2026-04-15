import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

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

    // --- 3D simplex noise ---
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise3(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0 / 7.0;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm3(vec3 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 5; i++) {
        val += amp * snoise3(p * freq);
        freq *= 2.2;
        amp *= 0.5;
      }
      return val;
    }

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

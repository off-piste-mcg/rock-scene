import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

const MistMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0.35,
    uColor: new THREE.Color("#205A74"),
  },
  // vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // billboard — always face camera
      vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vec2 scale = vec2(
        length(modelMatrix[0].xyz),
        length(modelMatrix[1].xyz)
      );
      mvPosition.xy += position.xy * scale;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // fragment
  `
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 6; i++) {
        val += amp * noise(p * freq);
        freq *= 2.0;
        amp *= 0.5;
      }
      return val;
    }

    void main() {
      vec2 uv = vUv;
      float t = mod(uTime * 0.03, 100.0);

      // sliding noise layers at different speeds
      float n1 = fbm(uv * 3.0 + vec2(t * 1.2, t * 0.8));
      float n2 = fbm(uv * 5.0 + vec2(-t * 0.9, t * 0.6));

      // use noise to distort UVs — creates morphing cloud shapes
      vec2 distortedUv = uv + vec2(n1, n2) * 0.1;

      // main cloud shape from distorted coordinates
      float cloud = fbm(distortedUv * 4.0 + vec2(t * 0.5, -t * 0.3));
      cloud = smoothstep(0.35, 0.6, cloud);
      cloud = pow(cloud, 0.8);

      // circular fade — soft cloud silhouette
      float dist = length((uv - 0.5) * 2.0);
      float circleFade = 1.0 - smoothstep(0.2, 1.0, dist);
      circleFade = pow(circleFade, 1.5);

      // icy highlights on dense areas
      float highlight = smoothstep(0.5, 1.0, cloud);
      vec3 col = mix(uColor, vec3(0.6, 0.8, 0.95), highlight * 0.5);

      float alpha = cloud * circleFade * uOpacity;

      gl_FragColor = vec4(col, alpha);
    }
  `
);

extend({ MistMaterial });

export default MistMaterial;

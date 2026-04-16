import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import "./MistMaterial";

function CloudSprite({ position, scale, speed, introDelay = 0 }) {
  const matRef = useRef();
  const meshRef = useRef();
  const intro = useRef({ scale: 0, opacity: 0 });

  useMemo(() => {
    gsap.to(intro.current, {
      scale: 1,
      opacity: 1,
      duration: 2,
      ease: "power2.out",
      delay: introDelay,
    });
  }, []);

  useFrame(({ clock }) => {
    matRef.current.uTime = clock.getElapsedTime() * speed;
    matRef.current.uOpacity = 0.35 * intro.current.opacity;
    const s = intro.current.scale;
    meshRef.current.scale.set(scale[0] * s, scale[1] * s, scale[2]);
  });

  return (
    <mesh ref={meshRef} position={position} scale={[0, 0, scale[2]]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <mistMaterial
        ref={matRef}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function WindSprite({ x, startY, z, speed, scale, delay, drift }) {
  const meshRef = useRef();
  const matRef = useRef();
  const travelDistance = Math.abs(startY) + 2;
  const intro = useRef({ opacity: 0 });

  useMemo(() => {
    gsap.to(intro.current, {
      opacity: 1,
      duration: 2,
      ease: "power2.out",
      delay: 1.5,
    });
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const t = ((elapsed * speed + delay) % 1.0);

    // move upward
    const y = startY + t * travelDistance;

    // gentle horizontal drift — creates the bending airflow curve
    const curveX = x + Math.sin(t * Math.PI) * drift;

    // fade in at bottom, gentle fade out at top
    const fadeIn = smoothstep(0, 0.15, t);
    const fadeOut = 1.0 - smoothstep(0.85, 1.0, t);
    const opacity = fadeIn * fadeOut * 0.25 * intro.current.opacity;

    meshRef.current.position.set(curveX, y, z);

    // slight rotation to follow the curve
    meshRef.current.rotation.z = Math.cos(t * Math.PI) * drift * 0.15;

    matRef.current.uTime = elapsed * speed * 0.3;
    matRef.current.uOpacity = opacity;
  });

  return (
    <mesh ref={meshRef} position={[x, startY, z]} scale={scale} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <mistMaterial
        ref={matRef}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function smoothstep(min, max, value) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

export default function Environment() {
  // cloud sprites clustered around the rock base
  const clouds = useMemo(() => [
    // near the rock — wispy fog (appear shortly after rock)
    { position: [0, -1.8, 0.5], scale: [4, 2.5, 1], speed: 1.0, introDelay: 0.8 },
    { position: [-1.2, -2.0, 0.8], scale: [3.5, 2, 1], speed: 0.8, introDelay: 1.0 },
    { position: [1.5, -1.9, 0.3], scale: [3, 2, 1], speed: 1.2, introDelay: 0.9 },
    { position: [0.3, -2.1, -0.5], scale: [3.5, 2.5, 1], speed: 0.9, introDelay: 1.1 },
    { position: [-0.8, -1.7, 1.0], scale: [2.5, 1.8, 1], speed: 1.1, introDelay: 1.0 },

    // bottom fog layer — wider, bloom in a bit later
    { position: [0, -2.5, 0], scale: [9, 2.5, 1], speed: 0.6, introDelay: 1.2 },
    { position: [-3, -2.6, -1], scale: [7, 2, 1], speed: 0.5, introDelay: 1.4 },
    { position: [3, -2.6, -1], scale: [7, 2, 1], speed: 0.7, introDelay: 1.3 },
    { position: [0, -2.7, -0.5], scale: [8, 2, 1], speed: 0.45, introDelay: 1.5 },
    { position: [-1.5, -2.5, 0.5], scale: [6, 1.8, 1], speed: 0.55, introDelay: 1.4 },
  ], []);

  // wind wisps rising vertically with gentle curved drift
  const windSprites = useMemo(() => [
    // right side — drift leftward toward rock
    { x: 1.0, startY: -3.5, z: 0.5, speed: 0.03, scale: [1.5, 3, 1], delay: 0, drift: -0.5 },
    { x: 1.4, startY: -4.0, z: 0.2, speed: 0.025, scale: [1.8, 3.5, 1], delay: 0.35, drift: -0.6 },
    { x: 0.8, startY: -3.8, z: 0.8, speed: 0.028, scale: [1.2, 2.5, 1], delay: 0.7, drift: -0.3 },
    // left side — drift rightward toward rock
    { x: -1.0, startY: -3.5, z: 0.4, speed: 0.03, scale: [1.5, 3, 1], delay: 0.15, drift: 0.5 },
    { x: -1.4, startY: -4.0, z: 0.1, speed: 0.022, scale: [1.8, 3.5, 1], delay: 0.5, drift: 0.6 },
    { x: -0.8, startY: -3.8, z: 0.7, speed: 0.026, scale: [1.2, 2.5, 1], delay: 0.85, drift: 0.3 },
    // in front of rock — subtle, passing across
    { x: 0.3, startY: -3.5, z: 2.5, speed: 0.02, scale: [1.2, 2.5, 1], delay: 0.2, drift: -0.3 },
    { x: -0.4, startY: -4.0, z: 2.2, speed: 0.018, scale: [1.5, 3, 1], delay: 0.6, drift: 0.25 },
  ], []);

  return (
    <>
      {clouds.map((cloud, i) => (
        <CloudSprite key={i} {...cloud} />
      ))}
      {windSprites.map((wind, i) => (
        <WindSprite key={`wind-${i}`} {...wind} />
      ))}
    </>
  );
}

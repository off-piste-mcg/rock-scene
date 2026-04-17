import { create } from "zustand";

// brightness: per-rock albedo multiplier (1.0 = unchanged). Tweak to dial
// individual rocks lighter/darker without re-exporting textures.
const rocks = [
  {
    label: "Entrance",
    texture: "/textures/entrance_beauty_2.ktx2",
    projection: "/textures/entrance_projection.ktx2",
    brightness: 1.0,
  },
  {
    label: "Info",
    texture: "/textures/rock1_beauty_2.ktx2",
    projection: "/textures/rock1_projection.ktx2",
    brightness: 1.15,
  },
  {
    label: "What we offer",
    texture: "/textures/rock2_beauty_2.ktx2",
    projection: "/textures/rock2_projection.ktx2",
    brightness: 1.0,
  },
  {
    label: "Go off-piste",
    texture: "/textures/rock2_beauty_2.ktx2",
    projection: "/textures/rock2_projection.ktx2",
    brightness: 1.0,
  },
];

const defaultResponsive = {
  1920: { scale: 1.5, cameraZ: 6, offset: [-1.5, 0, 0], projScale: 0.4, projOffset: [0.4, 0.65], reflectionY: -3.5, fogY: 0 },
  1440: { scale: 1.5, cameraZ: 6, offset: [-1.2, 0, 0], projScale: 0.4, projOffset: [0.4, 0.65], reflectionY: -3.5, fogY: 0 },
  1024: { scale: 1.35, cameraZ: 6.5, offset: [-0.5, 0, 0], projScale: 0.4, projOffset: [0.4, 0.65], reflectionY: -3.5, fogY: 0 },
  768: { scale: 1.1, cameraZ: 7, offset: [0, 0, 0], projScale: 0.5, projOffset: [0.4, 0.65], reflectionY: -2.5, fogY: 0 },
  480: { scale: 1.1, cameraZ: 6, offset: [0, -0.5, 0], projScale: 0.55, projOffset: [0.4, 0.75], reflectionY: -2.25, fogY: 0 },
  0: { scale: 1, cameraZ: 6, offset: [0, 0, 0], projScale: 0.3, projOffset: [0.4, 0.65], reflectionY: -3.5, fogY: 0 },
};

export const useStore = create((set) => ({
  rocks,
  activeIndex: 0,
  assetBaseUrl: "",
  responsive: defaultResponsive,
  setActiveIndex: (index) => set({ activeIndex: index }),
  setAssetBaseUrl: (url) => set({ assetBaseUrl: url }),
  setResponsive: (config) =>
    set((state) => {
      const merged = { ...defaultResponsive };
      for (const [bp, values] of Object.entries(config)) {
        merged[bp] = { ...merged[bp], ...values };
      }
      return { responsive: merged };
    }),
}));

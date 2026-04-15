import { create } from "zustand";

const rocks = [
  {
    label: "Entrance",
    texture: "/textures/entrance_beauty_2.png",
    projection: "/textures/entrance_projection.png",
  },
  {
    label: "Info",
    texture: "/textures/rock1_beauty_2.png",
    projection: "/textures/rock1_projection.png",
  },
  {
    label: "What we offer",
    texture: "/textures/rock2_beauty_2.png",
    projection: "/textures/rock2_projection.png",
  },
  {
    label: "Go off-piste",
    texture: "/textures/rock2_beauty_2.png",
    projection: "/textures/rock2_projection.png",
  },
];

const defaultResponsive = {
  1920: { scale: 1.5, cameraZ: 6, offset: [-1.5, 0, 0] },
  1440: { scale: 1.5, cameraZ: 6, offset: [-1.2, 0, 0] },
  1024: { scale: 1.35, cameraZ: 6.5, offset: [-0.5, 0, 0] },
  768: { scale: 1.1, cameraZ: 7, offset: [0, 0, 0] },
  480: { scale: 0.9, cameraZ: 8, offset: [0, 0, 0] },
  0: { scale: 0.75, cameraZ: 9, offset: [0, 0, 0] },
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

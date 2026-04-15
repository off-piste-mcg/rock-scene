import { create } from "zustand";

const rocks = [
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
];

export const useStore = create((set) => ({
  rocks,
  activeIndex: 0,
  assetBaseUrl: "",
  setActiveIndex: (index) => set({ activeIndex: index }),
  setAssetBaseUrl: (url) => set({ assetBaseUrl: url }),
}));

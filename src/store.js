import { create } from "zustand";

const states = [
  { label: "Albedo", color: "#4a7c2e" },
  { label: "Beauty", color: "#2e6b9e" },
  { label: "Normals", color: "#b0c4de" },
];

export const useStore = create((set) => ({
  states,
  activeIndex: 0,
  assetBaseUrl: "",
  setActiveIndex: (index) => set({ activeIndex: index }),
  setAssetBaseUrl: (url) => set({ assetBaseUrl: url }),
}));

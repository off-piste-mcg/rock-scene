import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { useStore } from "./store";

/**
 * Mount the rock scene into a target element.
 * @param {string|HTMLElement} target - CSS selector or DOM element
 * @param {object} options
 * @param {string} options.assetBaseUrl - Base URL for models/textures
 */
function mount(target, options = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) {
    console.error("[RockScene] Target element not found:", target);
    return;
  }

  if (options.assetBaseUrl) {
    useStore.getState().setAssetBaseUrl(options.assetBaseUrl);
  }

  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Auto-mount if #rock-scene exists (for standalone dev)
if (document.getElementById("rock-scene") || document.getElementById("root")) {
  mount(document.getElementById("rock-scene") || document.getElementById("root"));
}

// Expose globally for Webflow embed
export { mount };

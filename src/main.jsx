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
  if (options.responsive) {
    useStore.getState().setResponsive(options.responsive);
  }

  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Detect asset base URL from the script's own src (works without any config)
function detectAssetBase() {
  const script = document.querySelector('script[src*="rock-scene"]');
  if (script) {
    const url = new URL(script.src);
    return url.origin;
  }
  return "";
}

// Auto-mount: look for #rock-scene or #root
const el = document.getElementById("rock-scene") || document.getElementById("root");
if (el) {
  const assetBaseUrl = el.getAttribute("data-asset-base") || detectAssetBase();
  mount(el, { assetBaseUrl });
}

// Also expose globally in case someone wants to mount manually
export { mount };

// Must run before any imports that reference `process`
if (typeof window !== "undefined" && !window.process) {
  window.process = { env: { NODE_ENV: "production" }, emit: function() {} };
}

import gsap from "gsap";
import { mount } from "./main.jsx";

gsap.defaults({ overwrite: "auto" });
gsap.ticker.lagSmoothing(0);

// Expose globally for Webflow
window.RockScene = { mount };

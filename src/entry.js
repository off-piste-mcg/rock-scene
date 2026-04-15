// Must run before any imports that reference `process`
if (typeof window !== "undefined" && !window.process) {
  window.process = { env: { NODE_ENV: "production" }, emit: function() {} };
}

export { mount } from "./main.jsx";

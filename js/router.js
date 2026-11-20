/**
 * Simple hash-based router (#/, #/module/:id, #/chapter/:id).
 * Hash routing avoids 404s on static GitHub Pages subpaths.
 */

export function parseRoute(hash = window.location.hash) {
  const clean = (hash || "#/").replace(/^#/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { view: "home" };
  }
  if (parts[0] === "glossary") {
    return { view: "glossary" };
  }
  if (parts[0] === "progress") {
    return { view: "progress" };
  }
  if (parts[0] === "module" && parts[1]) {
    return { view: "module", moduleId: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "chapter" && parts[1]) {
    return { view: "chapter", chapterId: decodeURIComponent(parts[1]) };
  }
  return { view: "not-found" };
}

export function startRouter(onRoute) {
  const handle = () => onRoute(parseRoute(window.location.hash));
  window.addEventListener("hashchange", handle);
  handle();
}

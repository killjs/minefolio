// Stacked Pages — Binder-style tab navigation for Quartz v5
//
// Architecture:
//   - State lives in sessionStorage (no URL manipulation — hash anchors & popovers work)
//   - Quartz's SPA router handles ALL navigation; we never intercept clicks
//   - We listen to Quartz "nav" events to learn about page changes and update tabs
//   - Tab clicks use window.spaNavigate() — the Quartz-approved navigation API
//   - The binder is a pure UI overlay rendered beside the page content

import { resolveBasePath } from "@quartz-community/utils/path";

// ── Types ─────────────────────────────────────────────────────────────

interface Tab {
  slug: string;
  title: string;
}

interface BinderState {
  tabs: Tab[];
  activeIndex: number;
}

// ── Constants ─────────────────────────────────────────────────────────

const STORAGE_KEY = "stacked-pages-state";

// ── Helpers ───────────────────────────────────────────────────────────

function getCurrentSlug(): string {
  let slug = window.location.pathname;
  if (slug.startsWith("/")) slug = slug.slice(1);
  if (slug.endsWith("/")) slug = slug.slice(0, -1);
  return slug || "index";
}

function getPageTitle(): string {
  const h1 = document.querySelector("h1");
  return h1?.textContent?.trim() || document.title || getCurrentSlug();
}

// ── SessionStorage state management ───────────────────────────────────

export function loadState(): BinderState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tabs) && typeof parsed.activeIndex === "number") {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupted state
  }
  return { tabs: [], activeIndex: -1 };
}

export function saveState(state: BinderState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures (e.g. quota exceeded, private browsing)
  }
}

function readConfig(container: HTMLElement) {
  return {
    maxTabs: parseInt(container.dataset.maxTabs || "8", 10),
    mobileBreakpoint: parseInt(container.dataset.mobileBreakpoint || "800", 10),
    showSpines: container.dataset.showSpines !== "false",
    animate: container.dataset.animate !== "false",
  };
}

// ── Binder rendering ──────────────────────────────────────────────────

function renderBinder(container: HTMLElement, state: BinderState) {
  const config = readConfig(container);

  // Hide on mobile
  if (window.innerWidth < config.mobileBreakpoint) {
    container.style.display = "none";
    document.body.classList.remove("has-binder-left", "has-binder-right");
    return;
  }
  container.style.display = "";

  // Don't render binder if only one tab (no point showing tabs for a single page)
  if (state.tabs.length <= 1) {
    container.innerHTML = "";
    container.classList.remove("binder-active");
    document.body.classList.remove("has-binder-left", "has-binder-right");
    return;
  }

  container.classList.add("binder-active");

  // Split tabs into left (before active) and right (after active)
  const leftTabs = state.tabs.slice(0, state.activeIndex + 1);
  const rightTabs = state.tabs.slice(state.activeIndex + 1);

  container.innerHTML = "";

  // Left tab strip
  if (leftTabs.length > 0) {
    const leftStrip = document.createElement("div");
    leftStrip.className = "binder-strip binder-strip-left";
    for (let i = 0; i < leftTabs.length; i++) {
      const tab = leftTabs[i]!;
      leftStrip.appendChild(createTabElement(tab, i, "left", state, config));
    }
    container.appendChild(leftStrip);
  }

  // Right tab strip
  if (rightTabs.length > 0) {
    const rightStrip = document.createElement("div");
    rightStrip.className = "binder-strip binder-strip-right";
    for (let i = 0; i < rightTabs.length; i++) {
      const realIndex = state.activeIndex + 1 + i;
      const tab = rightTabs[i]!;
      rightStrip.appendChild(createTabElement(tab, realIndex, "right", state, config));
    }
    container.appendChild(rightStrip);
  }
  // Toggle body classes so CSS can push content aside
  document.body.classList.toggle("has-binder-left", leftTabs.length > 0);
  document.body.classList.toggle("has-binder-right", rightTabs.length > 0);
}

function createTabElement(
  tab: Tab,
  index: number,
  side: "left" | "right",
  state: BinderState,
  config: { showSpines: boolean },
): HTMLElement {
  const el = document.createElement("div");
  el.className = `binder-tab binder-tab-${side}`;
  el.dataset.index = String(index);
  if (index === state.activeIndex) {
    el.classList.add("binder-tab-active");
  }

  // Spine accent bar
  if (config.showSpines) {
    const spine = document.createElement("div");
    spine.className = "binder-spine";
    el.appendChild(spine);
  }

  // Label
  const label = document.createElement("span");
  label.className = "binder-label";
  label.textContent = tab.title;
  el.appendChild(label);

  // Close button (only when 2+ tabs)
  if (state.tabs.length >= 2) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "binder-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", `Close ${tab.title}`);
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(index);
    });
    el.appendChild(closeBtn);
  }

  // Click to navigate
  el.addEventListener("click", () => {
    navigateToTab(index);
  });

  return el;
}

// ── Tab operations ────────────────────────────────────────────────────

function navigateToTab(index: number) {
  const state = loadState();
  if (index < 0 || index >= state.tabs.length) return;

  const tab = state.tabs[index];
  if (!tab) return;
  // Update active index before navigation so the nav handler knows this is a tab switch
  state.activeIndex = index;
  saveState(state);

  // Use Quartz's SPA navigation
  const url = new URL(resolveBasePath(tab.slug), window.location.origin);
  if (window.spaNavigate) {
    window.spaNavigate(url, false);
  } else {
    window.location.href = url.toString();
  }
}

function closeTab(index: number) {
  const state = loadState();
  if (state.tabs.length < 2) return;

  const wasActive = index === state.activeIndex;
  state.tabs.splice(index, 1);

  if (wasActive) {
    // Navigate to the nearest remaining tab
    state.activeIndex = Math.min(index, state.tabs.length - 1);
    saveState(state);
    navigateToTab(state.activeIndex);
  } else {
    // Adjust active index if we removed a tab before it
    if (index < state.activeIndex) {
      state.activeIndex--;
    }
    saveState(state);
    renderBinderUI();
  }
}

// ── Main nav handler ──────────────────────────────────────────────────

let lastProcessedSlug: string | null = null;

function handleNavigation() {
  const container = document.getElementById("stacked-pages-container");
  if (!container) return;

  const slug = getCurrentSlug();
  const title = getPageTitle();

  // Avoid processing the same slug twice (e.g. render event after nav)
  if (slug === lastProcessedSlug) {
    renderBinder(container, loadState());
    return;
  }
  lastProcessedSlug = slug;

  const state = loadState();
  const config = readConfig(container);

  // Check if this slug already exists in tabs
  const existingIndex = state.tabs.findIndex((t) => t.slug === slug);

  if (existingIndex >= 0) {
    // Tab already exists — just switch to it, update title in case it changed
    state.tabs[existingIndex]!.title = title;
    state.activeIndex = existingIndex;
  } else {
    // New page — insert as a new tab after the current active tab
    const newTab: Tab = { slug, title };
    const insertAt = state.activeIndex + 1;
    state.tabs.splice(insertAt, 0, newTab);
    state.activeIndex = insertAt;

    // Evict oldest tabs if over limit (evict from the opposite end of active)
    while (state.tabs.length > config.maxTabs) {
      if (state.activeIndex > 0) {
        // Evict from the start
        state.tabs.shift();
        state.activeIndex--;
      } else {
        // Evict from the end
        state.tabs.pop();
      }
    }
  }

  saveState(state);
  renderBinder(container, state);
}

function renderBinderUI() {
  const container = document.getElementById("stacked-pages-container");
  if (!container) return;
  renderBinder(container, loadState());
}

// ── Initialization ────────────────────────────────────────────────────

function init() {
  handleNavigation();

  // Re-render on resize (mobile breakpoint)
  const resizeHandler = () => renderBinderUI();
  window.addEventListener("resize", resizeHandler);
  if (window.addCleanup) {
    window.addCleanup(() => window.removeEventListener("resize", resizeHandler));
  }
}

// Listen to Quartz navigation events
if (typeof document !== "undefined") {
  document.addEventListener("nav", () => {
    init();
  });

  // Re-render on in-place content changes (e.g. decryption)
  document.addEventListener("render", () => {
    renderBinderUI();
  });
}

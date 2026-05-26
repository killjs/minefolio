import { describe, expect, it, vi } from "vitest";
import type { StackedPagesOptions } from "../src/types";

vi.mock("../src/components/styles/stacked.scss", () => ({ default: "" }));
vi.mock("../src/components/scripts/stacked.inline.ts", () => ({ default: "" }));

describe("StackedPages types", () => {
  it("accepts the stacked pages options shape", () => {
    const options: StackedPagesOptions = {
      maxTabs: 8,
      mobileBreakpoint: 800,
      showSpines: true,
      animateTransitions: true,
    };

    expect(options.maxTabs).toBe(8);
    expect(options.mobileBreakpoint).toBe(800);
  });
});

describe("StackedPages component", () => {
  it("returns a component with css and afterDOMLoaded", async () => {
    const { default: StackedPages } = await import("../src/components/StackedPages");
    const Component = StackedPages();

    expect(Component).toBeTypeOf("function");
    expect(Component.css).toBeDefined();
    expect(Component.afterDOMLoaded).toBeDefined();
  });
});

describe("state helpers", () => {
  // Polyfill sessionStorage for Node test environment
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };

  it("loads and saves binder state", async () => {
    vi.stubGlobal("sessionStorage", mockStorage);

    const actual = await vi.importActual<
      typeof import("../src/components/scripts/stacked.inline.ts")
    >("../src/components/scripts/stacked.inline.ts");

    // loadState returns empty state when nothing in storage
    mockStorage.clear();
    const empty = actual.loadState();
    expect(empty).toEqual({ tabs: [], activeIndex: -1 });

    // saveState + loadState round-trips
    const state = {
      tabs: [
        { slug: "docs/alpha", title: "Alpha" },
        { slug: "notes/beta", title: "Beta" },
      ],
      activeIndex: 1,
    };
    actual.saveState(state);
    const loaded = actual.loadState();
    expect(loaded).toEqual(state);

    vi.unstubAllGlobals();
  });
});

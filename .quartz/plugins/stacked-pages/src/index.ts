export { ExampleTransformer } from "./transformer";
export { ExampleFilter } from "./filter";
export { ExampleEmitter } from "./emitter";
export { default as ExampleComponent } from "./components/ExampleComponent";

export type {
  ExampleTransformerOptions,
  ExampleFilterOptions,
  ExampleEmitterOptions,
} from "./types";

export type { ExampleComponentOptions } from "./components/ExampleComponent";
export { default as StackedPages } from "./components/StackedPages";
export type { StackedPagesComponentOptions } from "./components/StackedPages";

export type { StackedPagesOptions } from "./types";

// Re-export shared types from @quartz-community/types
export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  StringResource,
  QuartzTransformerPlugin,
  QuartzFilterPlugin,
  QuartzEmitterPlugin,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
  PageGenerator,
  VirtualPage,
} from "@quartz-community/types";

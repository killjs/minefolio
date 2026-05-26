import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";

import style from "./styles/stacked.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/stacked.inline.ts";

export interface StackedPagesComponentOptions {
  maxTabs?: number;
  mobileBreakpoint?: number;
  showSpines?: boolean;
  animateTransitions?: boolean;
}

export default ((opts?: StackedPagesComponentOptions) => {
  const {
    maxTabs = 8,
    mobileBreakpoint = 800,
    showSpines = true,
    animateTransitions = true,
  } = opts ?? {};

  const Component: QuartzComponent = (_props: QuartzComponentProps) => {
    return (
      <div
        id="stacked-pages-container"
        data-max-tabs={maxTabs}
        data-mobile-breakpoint={mobileBreakpoint}
        data-show-spines={showSpines}
        data-animate={animateTransitions}
      />
    );
  };

  Component.css = style;
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;

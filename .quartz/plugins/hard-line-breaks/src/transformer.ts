import remarkBreaks from "remark-breaks";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

export const HardLineBreaks: QuartzTransformerPlugin = () => {
  return {
    name: "HardLineBreaks",
    markdownPlugins() {
      return [remarkBreaks];
    },
  };
};

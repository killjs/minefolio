import type { QuartzFilterPlugin } from "@quartz-community/types";

export const ExplicitPublish: QuartzFilterPlugin = () => ({
  name: "ExplicitPublish",
  shouldPublish(_ctx, [_tree, vfile]) {
    const frontmatter = vfile.data?.frontmatter as Record<string, unknown> | undefined;
    return frontmatter?.publish === true || frontmatter?.publish === "true";
  },
});

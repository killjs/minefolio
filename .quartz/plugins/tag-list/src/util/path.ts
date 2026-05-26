import { simplifySlug as utilSimplifySlug, joinSegments } from "@quartz-community/utils";

/**
 * Simplifies a full slug by removing the '/index' suffix.
 * Uses the utility from @quartz-community/utils.
 */
export function simplifySlug(fp: string): string {
  return utilSimplifySlug(fp);
}

/**
 * Resolves a relative path from current slug to target slug.
 * @param current - The current page's slug
 * @param target - The target page's slug
 * @returns A relative path like "../.." or "./page"
 */
export function resolveRelative(current: string, target: string): string {
  const simplified = simplifySlug(target);
  const rootPath = pathToRoot(current);
  return joinSegments(rootPath, simplified);
}

/**
 * Gets the path to root from a given slug.
 * For example, "a/b/c" becomes "../../.."
 */
function pathToRoot(slug: string): string {
  let rootPath = slug
    .split("/")
    .filter((x) => x !== "")
    .slice(0, -1)
    .map((_) => "..")
    .join("/");

  if (rootPath.length === 0) {
    rootPath = ".";
  }

  return rootPath;
}

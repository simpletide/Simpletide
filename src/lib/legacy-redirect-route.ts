import { createFileRoute, redirect } from "@tanstack/react-router";
import { LEGACY_PATH_REDIRECTS, normalizePath } from "@/lib/site-seo";

/** Factory for permanent redirects from old simpletide.com URL paths. */
export function legacyRedirectRoute(fromPath: string) {
  const target = LEGACY_PATH_REDIRECTS[normalizePath(fromPath)];
  if (!target) {
    throw new Error(`No legacy redirect target configured for ${fromPath}`);
  }

  return createFileRoute(fromPath as never)({
    beforeLoad: () => {
      throw redirect({ href: target, statusCode: 301 });
    },
    component: () => null,
  });
}

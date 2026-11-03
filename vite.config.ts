// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { visualizer } from "rollup-plugin-visualizer";

// Opt-in only (`ANALYZE=1 npm run build`) so normal and Vercel builds are untouched.
const analyze = process.env.ANALYZE === "1";

export default defineConfig({
  // Outside a Lovable sandbox the deploy plugin is skipped unless `nitro` is set
  // explicitly, which leaves no server bundle for Vercel to run. In the sandbox
  // this is overridden back to cloudflare-module, so Lovable builds are unaffected.
  nitro: {
    // Vercel in normal use. NITRO_PRESET=node-server produces a runnable
    // .output/server/index.mjs, which is how a production build can be served
    // locally for Lighthouse runs. Vercel doesn't set this variable.
    preset: process.env.NITRO_PRESET || "vercel",
    // Nitro already marks /assets/* immutable (those filenames are hashed).
    // Static art and fonts need it declared. Note this means replacing an image
    // in place won't reach visitors who already cached it — ship a new filename
    // when the artwork changes.
    routeRules: {
      "/images/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/fonts/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: { allowedHosts: [".trycloudflare.com"] },
    plugins: analyze
      ? [visualizer({ filename: "bundle-report.html", gzipSize: true, brotliSize: true, template: "treemap" })]
      : [],
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              // Without this Rollup folds these into the shared vendor chunk that
              // every page loads. Pinning them to their own chunks means the
              // Supabase SDK is fetched after first paint (or by the account /
              // checkout routes that import it directly), and the toast host only
              // when something actually raises a toast.
              manualChunks(id: string) {
                const path = id.replace(/\\/g, "/");
                // Vite's `__vite__preload` helper is needed by every chunk that
                // lazy-loads anything. Left alone, Rollup parks it inside one of
                // the manual chunks below, which makes that whole chunk a static
                // dependency of the entire app — the opposite of the point.
                if (path.includes("vite/preload-helper")) return "preload-helper";
                if (path.includes("node_modules/@supabase/")) return "supabase";
                // `client.ts` is imported both dynamically (supabase-lazy) and
                // statically (checkout, account, AuthForm). Rollup resolves that
                // by hoisting it into the entry chunk, which drags the whole SDK
                // back in as a static dependency. Pinning it keeps it deferred.
                if (path.includes("/src/integrations/supabase/client")) return "supabase";
                if (path.includes("node_modules/sonner")) return "sonner";
              },
            },
          },
        },
      },
    },
  },
});

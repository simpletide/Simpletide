// Fingerprints built client chunks for heavy modules. Uses code-level markers
// rather than loose names, so Vite's dependency map doesn't cause false hits.
import { readFileSync, existsSync, readdirSync } from "node:fs";

const dir = [".vercel/output/static/assets", "dist/client/assets"].find((d) => existsSync(d));
if (!dir) process.exit(1);

const probes = {
  "catalog data": /Retatrutide|high-purity research-grade peptide/,
  "supabase SDK": /GoTrueClient|PostgrestClient/,
  "sonner (toast)": /data-sonner-toaster|\[data-sonner/,
  "react-dom": /__reactContainer|ReactDOMSharedInternals|createPortal/,
  "react-router": /createRootRouteWithContext|RouterProvider|__TSR__/,
  "react-query": /QueryClient|QueryObserver/,
  "home route": /SimpletideHome|HOME_VARIANTS/,
  starfield: /vial-float-center|Starfield|PASTEL_COLORS/,
};

const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
const rows = files
  .map((f) => {
    const txt = readFileSync(`${dir}/${f}`, "utf8");
    return { name: f.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js"), kb: Math.round(txt.length / 1024), txt };
  })
  .sort((a, b) => b.kb - a.kb);

for (const [label, re] of Object.entries(probes)) {
  const where = rows.filter((r) => re.test(r.txt)).map((r) => `${r.name} (${r.kb}KB)`);
  console.log(`${label.padEnd(18)} ${where.length ? where.join(", ") : "-"}`);
}

console.log("\n=== entry module referenced by the built HTML ===");
const htmlDir = dir.replace(/\/assets$/, "");
for (const f of readdirSync(htmlDir).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(`${htmlDir}/${f}`, "utf8");
  for (const m of html.matchAll(/<script[^>]*src="([^"]+)"/g)) console.log(`${f}: ${m[1]}`);
}

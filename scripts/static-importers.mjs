import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = ".output/public/assets";
const target = process.argv[2] || "supabase";

for (const f of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
  const code = readFileSync(join(dir, f), "utf8");
  // Only top-level static `import ... from "..."` / `import "..."` forms.
  const re = /(?:^|[;\n])\s*import\s*(?:([^;'"]*?)\s*from\s*)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(code))) {
    if (m[2].includes(target)) {
      console.log(`${f}\n    imports ${m[2]}  bindings: ${(m[1] || "(side effect)").trim()}`);
    }
  }
}

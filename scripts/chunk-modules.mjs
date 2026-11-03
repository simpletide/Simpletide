import { readFileSync } from "node:fs";

const html = readFileSync("bundle-report.html", "utf8");
const m = html.match(/<script>\s*\/\*\*\s*@preserve[\s\S]*?const data = (\{[\s\S]*?\});/);
const raw = m ? m[1] : html.match(/const data = (\{[\s\S]*?\});/)?.[1];
if (!raw) {
  console.error("could not find visualizer data");
  process.exit(1);
}
const data = JSON.parse(raw);

const want = process.argv[2] || "supabase";
const nodes = data.tree ?? data.nodeParts;

function walk(node, path, out) {
  if (node.children) {
    for (const c of node.children) walk(c, path.concat(node.name ?? ""), out);
  } else {
    out.push({ path: path.concat(node.name).filter(Boolean).join("/"), uid: node.uid });
  }
}
const leaves = [];
walk(data.tree, [], leaves);

const matched = leaves.filter((l) => l.path.includes(want));
const sized = matched
  .map((l) => ({
    path: l.path,
    bytes: data.nodeParts?.[l.uid]?.renderedLength ?? 0,
  }))
  .sort((a, b) => b.bytes - a.bytes);

console.log(`modules under a chunk matching "${want}":\n`);
for (const s of sized.slice(0, 40)) {
  console.log(`  ${(s.bytes / 1024).toFixed(1).padStart(8)} KB  ${s.path}`);
}
console.log(
  `\ntotal: ${(sized.reduce((a, s) => a + s.bytes, 0) / 1024).toFixed(1)} KB across ${sized.length} modules`
);

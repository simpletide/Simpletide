/**
 * Generates width-variant WebP files beside each source image, e.g.
 * `glp-3-rt.webp` -> `glp-3-rt-320.webp` / `-640.webp`.
 *
 * The originals stay untouched and remain the largest srcset candidate, so
 * desktop and retina are unchanged while phones fetch something far smaller.
 *
 * Re-running is safe: existing variants are skipped unless --force is passed.
 * Requires sharp, which is installed on demand rather than kept as a dependency
 * (`npm i sharp --no-save`).
 */
import sharp from "sharp";
import { readdirSync, existsSync, statSync } from "node:fs";

const force = process.argv.includes("--force");

const GROUPS = [
  { dir: "public/images/hero-vials", widths: [400, 800, 1200] },
  { dir: "public/images/cards", widths: [320, 640] },
  { dir: "public/images/vials", widths: [320, 640] },
];

const isVariant = (f) => /-\d+\.webp$/.test(f);

let made = 0;
let bytes = 0;

for (const { dir, widths } of GROUPS) {
  if (!existsSync(dir)) continue;
  const sources = readdirSync(dir).filter((f) => f.endsWith(".webp") && !isVariant(f));

  for (const file of sources) {
    const src = `${dir}/${file}`;
    const meta = await sharp(src).metadata();

    for (const w of widths) {
      if (w >= meta.width) continue; // never upscale
      const out = `${dir}/${file.replace(/\.webp$/, `-${w}.webp`)}`;
      if (existsSync(out) && !force) continue;

      await sharp(src)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 86, alphaQuality: 100, effort: 6 })
        .toFile(out);

      made++;
      bytes += statSync(out).size;
      console.log(`${String(Math.round(statSync(out).size / 1024)).padStart(5)} KB  ${out}`);
    }
  }
}

console.log(`\n${made} variants generated, ${(bytes / 1024 / 1024).toFixed(2)} MB added to the image set`);

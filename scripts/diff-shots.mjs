/**
 * Mean / max per-pixel difference between two PNGs of the same size.
 * Usage: node scripts/diff-shots.mjs a.png b.png [out-diff.png]
 */
import sharp from "sharp";

const [, , aPath, bPath, outPath] = process.argv;

const a = sharp(aPath);
const b = sharp(bPath);
const ma = await a.metadata();
const mb = await b.metadata();

const w = Math.min(ma.width, mb.width);
const h = Math.min(ma.height, mb.height);

const bufA = await sharp(aPath).extract({ left: 0, top: 0, width: w, height: h }).removeAlpha().raw().toBuffer();
const bufB = await sharp(bPath).extract({ left: 0, top: 0, width: w, height: h }).removeAlpha().raw().toBuffer();

let sum = 0;
let max = 0;
let over8 = 0;
const diff = Buffer.alloc(bufA.length);
for (let i = 0; i < bufA.length; i += 3) {
  const d =
    (Math.abs(bufA[i] - bufB[i]) +
      Math.abs(bufA[i + 1] - bufB[i + 1]) +
      Math.abs(bufA[i + 2] - bufB[i + 2])) /
    3;
  sum += d;
  if (d > max) max = d;
  if (d > 8) over8++;
  const v = Math.min(255, d * 8);
  diff[i] = v;
  diff[i + 1] = v;
  diff[i + 2] = v;
}
const px = bufA.length / 3;

console.log(`size compared      ${w}x${h} (${ma.width}x${ma.height} vs ${mb.width}x${mb.height})`);
console.log(`mean difference    ${(sum / px).toFixed(2)} / 255`);
console.log(`max difference     ${max.toFixed(0)} / 255`);
console.log(`pixels off by >8   ${((over8 / px) * 100).toFixed(2)}%`);

if (outPath) {
  await sharp(diff, { raw: { width: w, height: h, channels: 3 } }).png().toFile(outPath);
  console.log(`wrote ${outPath} (amplified 8x)`);
}

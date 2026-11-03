/**
 * Which scripts are actually blocking the main thread, per Lighthouse.
 * Usage: node scripts/tbt-breakdown.mjs [url] [runs]
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const url = process.argv[2] ?? "http://localhost:3100/";
const runs = Number(process.argv[3] ?? 1);

for (let i = 0; i < runs; i++) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
    chromePath:
      process.env.CHROME_PATH ??
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  });

  const { lhr } = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    onlyCategories: ["performance"],
  });
  await chrome.kill();

  const a = lhr.audits;
  console.log(`\n===== run ${i + 1} =====`);
  console.log(`TBT ${Math.round(a["total-blocking-time"].numericValue)} ms`);

  const boot = a["bootup-time"]?.details?.items ?? [];
  console.log("\nscript evaluation + parse (bootup-time):");
  for (const it of boot.slice(0, 10)) {
    const name = String(it.url).split("/").pop();
    console.log(
      `  total ${Math.round(it.total).toString().padStart(5)} ms   eval ${Math
        .round(it.scripting)
        .toString()
        .padStart(5)} ms   parse ${Math.round(it.scriptParseCompile)
        .toString()
        .padStart(4)} ms   ${name}`
    );
  }

  const tasks = a["long-tasks"]?.details?.items ?? [];
  console.log("\nlong tasks:");
  for (const t of tasks.slice(0, 12)) {
    console.log(
      `  start ${Math.round(t.startTime).toString().padStart(5)} ms  dur ${Math.round(
        t.duration
      )
        .toString()
        .padStart(4)} ms  ${String(t.url).split("/").pop()}`
    );
  }

  const work = a["mainthread-work-breakdown"]?.details?.items ?? [];
  console.log("\nmain-thread work by category:");
  for (const w of work.slice(0, 8)) {
    console.log(`  ${String(w.groupLabel).padEnd(26)} ${Math.round(w.duration)} ms`);
  }
}

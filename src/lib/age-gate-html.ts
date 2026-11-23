import { AGE_COOKIE_NAME, AGE_STORAGE_KEY, sanitizeReturnPath } from "./age-gate";

/**
 * Standalone, zero-store-dependency HTML for `/age?return=...`.
 * Contains ZERO product names, ZERO vial imagery, ZERO store meta tags,
 * and loads ZERO storefront JS bundles (no `catalog-*.js` preloads).
 */
export function renderAgeGateHtml(rawReturn: string | null): string {
  const safeReturn = sanitizeReturnPath(rawReturn);
  // Safe JSON string literal for embedding inside <script>
  const returnJson = JSON.stringify(safeReturn).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f3e8ff" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta name="description" content="Simpletide researcher verification." />
  <title>Researcher Verification | Simpletide</title>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-400.woff2" crossorigin="anonymous" />
  <style>
    @font-face {
      font-family: "Inter";
      font-style: normal;
      font-weight: 300 800;
      font-display: swap;
      src: url("/fonts/inter-latin-400.woff2") format("woff2");
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      overflow: hidden;
      background: linear-gradient(180deg, #fdf2f8 0%, #f3e8ff 46%, #eef4ff 100%);
    }
    .bg {
      pointer-events: none;
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(64px);
    }
    .orb-1 { top: -96px; left: -96px; width: 320px; height: 320px; opacity: 0.55; background: radial-gradient(circle, #f9a8d4 0%, transparent 70%); }
    .orb-2 { top: 25%; right: -96px; width: 384px; height: 384px; opacity: 0.5; background: radial-gradient(circle, #c4b5fd 0%, transparent 70%); }
    .orb-3 { bottom: 0; left: 33%; width: 320px; height: 320px; opacity: 0.45; background: radial-gradient(circle, #93c5fd 0%, transparent 70%); }
    .waves {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 176px;
      opacity: 0.35;
    }
    main {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .wordmark {
      margin-bottom: 24px;
      text-align: center;
      font-size: 26px;
      font-weight: 300;
      letter-spacing: 0.3em;
      color: #344a7c;
    }
    .grad {
      background: linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #38bdf8 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .card {
      width: 100%;
      max-width: 460px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.95);
      padding: 28px 24px;
      box-shadow: 0 20px 60px -15px rgba(76, 29, 149, 0.18);
      backdrop-filter: blur(8px);
    }
    @media (min-width: 640px) {
      .wordmark { font-size: 30px; }
      .card { padding: 32px; }
    }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.2;
      color: #0f172a;
    }
    @media (min-width: 640px) { h1 { font-size: 26px; } }
    .lead {
      margin: 12px 0 0;
      font-size: 13.5px;
      line-height: 1.6;
      color: #64748b;
    }
    .checks {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .check-row {
      display: flex;
      width: 100%;
      align-items: flex-start;
      gap: 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 14px 16px;
      text-align: left;
      cursor: pointer;
      transition: border-color 180ms ease, box-shadow 180ms ease;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
    }
    .check-row:hover { border-color: #cbd5e1; }
    .check-row[aria-checked="true"] {
      border-color: #a78bfa;
      box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.35), 0 4px 16px rgba(167, 139, 250, 0.12);
    }
    .box {
      margin-top: 2px;
      display: flex;
      height: 20px;
      width: 20px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: transparent;
      transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
    }
    .check-row[aria-checked="true"] .box {
      border-color: #8b5cf6;
      background: #8b5cf6;
      color: #ffffff;
    }
    .check-text {
      font-size: 13.5px;
      line-height: 1.4;
      color: #334155;
    }
    .check-text strong { font-weight: 600; color: #0f172a; }
    .enter-btn {
      margin-top: 24px;
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 9999px;
      padding: 14px 24px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      transition: background-color 200ms ease, transform 200ms ease, box-shadow 200ms ease, color 200ms ease;
    }
    .enter-btn:not(:disabled) {
      background: #020617;
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 12px 28px -8px rgba(15, 23, 42, 0.4);
    }
    .enter-btn:not(:disabled):hover {
      background: #0f172a;
      transform: translateY(-1px);
    }
    .disclaimer {
      margin: 20px 0 0;
      font-size: 11px;
      line-height: 1.6;
      color: #94a3b8;
    }
    .disclaimer a {
      color: #64748b;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .disclaimer a:hover { color: #334155; }
    .exit-btn {
      margin-top: 20px;
      border: 0;
      background: transparent;
      padding: 4px 8px;
      font-family: inherit;
      font-size: 13px;
      color: #64748b;
      cursor: pointer;
    }
    .exit-btn:hover { color: #334155; }
    .exit-btn span { font-weight: 600; color: #7c3aed; }
    footer {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 6px 20px;
      padding: 0 20px 24px;
      font-size: 12px;
      color: #64748b;
    }
    footer nav { display: flex; align-items: center; gap: 16px; }
    footer a { color: inherit; text-decoration: none; }
    footer a:hover { color: #1e293b; text-decoration: underline; }
    .noscript-msg {
      margin-top: 12px;
      font-size: 12px;
      color: #b91c1c;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="bg" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <svg class="waves" viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path fill="#c4b5fd" fill-opacity="0.35" d="M0,128 C240,72 480,180 720,124 C960,68 1200,168 1440,112 L1440,220 L0,220 Z"></path>
        <path fill="#93c5fd" fill-opacity="0.3" d="M0,164 C300,118 600,204 900,152 C1140,110 1320,174 1440,150 L1440,220 L0,220 Z"></path>
      </svg>
    </div>

    <main>
      <div class="wordmark"><span class="grad">SIMPLE</span>TIDE</div>

      <section class="card" aria-labelledby="age-gate-title">
        <h1 id="age-gate-title">Researcher <span class="grad">Verification</span></h1>
        <p class="lead">
          Simpletide sells research material exclusively to qualified researchers and laboratories
          for in vitro and laboratory use. Please confirm before continuing.
        </p>

        <div class="checks">
          <button type="button" id="chk-age" class="check-row" role="checkbox" aria-checked="false">
            <span class="box" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
            </span>
            <span class="check-text">I am at least <strong>21 years of age</strong>.</span>
          </button>

          <button type="button" id="chk-res" class="check-row" role="checkbox" aria-checked="false">
            <span class="box" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
            </span>
            <span class="check-text">
              I confirm I am a <strong>qualified researcher</strong> purchasing for
              <strong>in vitro / laboratory research</strong> only &mdash; not for human or veterinary use.
            </span>
          </button>
        </div>

        <button type="button" id="btn-enter" class="enter-btn" disabled>
          <span>Enter Simpletide</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </button>

        <noscript><p class="noscript-msg">Please enable JavaScript to continue.</p></noscript>

        <p class="disclaimer">
          By proceeding you affirm the statements above are true. Products are not for human or
          veterinary use, not for use in diagnostic procedures, and have not been evaluated by the
          U.S. Food and Drug Administration. <a href="/disclaimer">Full disclaimer.</a>
        </p>
      </section>

      <button type="button" id="btn-exit" class="exit-btn">
        Not a researcher? <span>Exit</span>
      </button>
    </main>

    <footer>
      <span>&copy; 2026 Simpletide</span>
      <nav aria-label="Policies">
        <a href="/terms-of-service">Terms</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="mailto:support@simpletide.com">Contact</a>
      </nav>
    </footer>
  </div>

  <script>
    (function () {
      var returnTo = ${returnJson};
      var ageBtn = document.getElementById("chk-age");
      var resBtn = document.getElementById("chk-res");
      var enterBtn = document.getElementById("btn-enter");
      var exitBtn = document.getElementById("btn-exit");
      var ageOk = false;
      var resOk = false;

      function sync() {
        ageBtn.setAttribute("aria-checked", ageOk ? "true" : "false");
        resBtn.setAttribute("aria-checked", resOk ? "true" : "false");
        enterBtn.disabled = !(ageOk && resOk);
      }

      ageBtn.addEventListener("click", function () { ageOk = !ageOk; sync(); });
      resBtn.addEventListener("click", function () { resOk = !resOk; sync(); });

      enterBtn.addEventListener("click", function () {
        if (!(ageOk && resOk)) return;
        try { localStorage.setItem(${JSON.stringify(AGE_STORAGE_KEY)}, "true"); } catch (e) {}
        try { document.cookie = ${JSON.stringify(AGE_COOKIE_NAME)} + "=1; path=/; max-age=2592000; SameSite=Lax"; } catch (e) {}
        window.location.replace(returnTo || "/");
      });

      exitBtn.addEventListener("click", function () {
        window.location.href = "https://www.google.com";
      });
    })();
  </script>
</body>
</html>`;
}

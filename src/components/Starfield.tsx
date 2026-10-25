import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  speed: number;
  size: number;
  fillStyle: string;
};

const GRADIENT_CSS =
  "linear-gradient(to bottom," +
  "#08142E 0%,#0D2043 10%,#122C59 20%,#18386E 30%,#1D4484 40%," +
  "#225099 50%,#285CAF 60%,#2D68C4 70%,#2C64BC 80%,#295CAC 90%,#255296 100%)";

const PASTEL_COLORS = ["251,207,232", "221,214,254", "186,230,253", "187,247,208", "254,215,170", "254,240,138", "245,208,254"];

/**
 * Full-viewport rising-mist background. Renders behind all content.
 * Gradient is CSS on the canvas element; each frame only clears and draws particles.
 * `pastel` draws pastel rainbow particles on a transparent canvas (for the white home page).
 */
export function Starfield({ pastel = false }: { pastel?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
    if (!ctx) return;

    const isMobile =
      window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dprCap = 2;
    const density = isMobile ? 0.65 : 0.8;

    let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    let w = 0;
    let h = 0;
    let rafId = 0;
    let lastT = performance.now();
    let isRunning = true;

    const rand = Math.random;
    const sizeFn = pastel
      ? () => (rand() < 0.25 ? rand() * 1.2 + 2 : rand() * 0.6 + 1.2)
      : () => (rand() < 0.15 ? rand() + 1.8 : 1);
    const fill = (a: number) =>
      pastel
        ? `rgba(${PASTEL_COLORS[Math.floor(rand() * PASTEL_COLORS.length)]},${Math.min(0.55, a * 1.1 + 0.12)})`
        : `rgba(255,255,255,${a})`;
    const SPEED = 2.2;

    const particles: Particle[] = [];
    const count = (n: number) => Math.max(1, Math.round(n * density));
    for (let i = 0; i < count(110); i++) {
      const fast = rand() < 0.2;
      const a = 0.28 * rand() + 0.12;
      particles.push({
        x: rand(),
        y: rand(),
        speed: fast ? 8e-4 * rand() + 6e-4 : 45e-5 * rand() + 18e-5,
        size: sizeFn(),
        fillStyle: fill(a),
      });
    }
    for (let i = 0; i < count(100); i++) {
      const fast = rand() < 0.15;
      const a = 0.3 * rand() + 0.1;
      particles.push({
        x: rand(),
        y: 0.45 + 0.55 * rand(),
        speed: fast ? 7e-4 * rand() + 5e-4 : 4e-4 * rand() + 15e-5,
        size: sizeFn(),
        fillStyle: fill(a),
      });
    }
    for (let i = 0; i < count(55); i++) {
      const fast = rand() < 0.2;
      const a = 0.25 * rand() + 0.12;
      particles.push({
        x: rand(),
        y: 0.7 + 0.3 * rand(),
        speed: fast ? 7e-4 * rand() + 5e-4 : 35e-5 * rand() + 15e-5,
        size: sizeFn(),
        fillStyle: fill(a),
      });
    }

    const drawParticles = (frames: number) => {
      ctx.clearRect(0, 0, w, h);
      const base = 1.2 * dpr;
      for (const p of particles) {
        p.y -= p.speed * frames * SPEED;
        if (p.y < -0.01) {
          p.y = 1.01;
          p.x = rand();
        }
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, base * p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.fillStyle;
        ctx.fill();
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      w = window.innerWidth * dpr;
      h = window.innerHeight * dpr;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const render = (t: number) => {
      if (!isRunning) return;
      rafId = requestAnimationFrame(render);

      const dt = Math.min(50, t - lastT);
      lastT = t;
      drawParticles(dt / (1000 / 60));
    };

    canvas.style.background = pastel ? "transparent" : GRADIENT_CSS;
    resize();
    drawParticles(0);

    if (!reduceMotion) {
      lastT = performance.now();
      rafId = requestAnimationFrame(render);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        drawParticles(0);
      }, 150);
    };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(rafId);
      } else {
        isRunning = true;
        lastT = performance.now();
        rafId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pastel]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
      aria-hidden="true"
    />
  );
}

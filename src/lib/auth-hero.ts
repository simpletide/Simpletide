export const AUTH_HERO_VIAL = "/images/hero-vials/simpletide-selank-semax-20mg.png";

export const AUTH_HERO_HEAD_LINKS = [
  { rel: "preload" as const, as: "image" as const, href: AUTH_HERO_VIAL, fetchPriority: "high" as const },
];

export function preloadAuthHeroImages() {
  for (const src of [AUTH_HERO_VIAL]) {
    const img = new Image();
    img.src = src;
  }
}

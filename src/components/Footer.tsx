import { Link } from "@tanstack/react-router";

// Footer trust-badge icons — exact SVG path data from Peptora's footer
// (peptoralabs.com /icons/social/*.svg), recolored to currentColor so the
// surrounding text color drives them. Native 16px viewBox + 1px stroke kept.
function SecurityCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.4725 2.33015C11.211 1.70247 9.66727 1.33325 8 1.33325C6.33273 1.33325 4.789 1.70247 3.52744 2.33015C2.90879 2.63796 2.59946 2.79187 2.29973 3.27577C2 3.75969 2 4.22824 2 5.16534V7.49132C2 11.2803 5.02824 13.3869 6.782 14.2891C7.27113 14.5408 7.51567 14.6666 8 14.6666C8.48433 14.6666 8.72887 14.5408 9.21793 14.2891C10.9717 13.3869 14 11.2803 14 7.49132V5.16534C14 4.22825 14 3.75969 13.7003 3.27577C13.4005 2.79186 13.0912 2.63796 12.4725 2.33015Z" />
      <path d="M6 7.66659C6 7.66659 6.9386 7.83452 7.33333 8.99992C7.33333 8.99992 8.33333 6.99992 10 6.33325" />
    </svg>
  );
}

function TestTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.69399 1.33325V2.99073C9.69399 4.15603 9.69399 4.73868 9.83666 5.29802C9.97932 5.85736 10.2589 6.37094 10.8181 7.39812L11.5759 8.79005C13.0009 11.4076 13.7134 12.7164 13.1289 13.6866L13.1198 13.7014C12.5267 14.6666 11.0179 14.6666 8.00032 14.6666C4.9827 14.6666 3.4739 14.6666 2.88086 13.7014L2.87182 13.6866C2.28729 12.7164 2.99978 11.4076 4.42476 8.79005L5.18252 7.39812C5.74172 6.37094 6.02132 5.85736 6.16398 5.29802C6.30664 4.73868 6.30664 4.15603 6.30664 2.99073V1.33325" />
      <path d="M6 10.6679L6.00506 10.6665" />
      <path d="M10 12.0012L10.0051 11.9998" />
      <path d="M5.33301 1.33325H10.6663" />
      <path d="M5 7.70432C5.66667 6.93539 6.73293 7.48965 8 8.21225C9.66667 9.16272 10.6667 8.43345 11 7.74359" />
    </svg>
  );
}

function TruckDeliveryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.3333 13.3334C12.0697 13.3334 12.6667 12.7365 12.6667 12.0001C12.6667 11.2637 12.0697 10.6667 11.3333 10.6667C10.597 10.6667 10 11.2637 10 12.0001C10 12.7365 10.597 13.3334 11.3333 13.3334Z" />
      <path d="M4.66634 13.3334C5.40272 13.3334 5.99967 12.7365 5.99967 12.0001C5.99967 11.2637 5.40272 10.6667 4.66634 10.6667C3.92996 10.6667 3.33301 11.2637 3.33301 12.0001C3.33301 12.7365 3.92996 13.3334 4.66634 13.3334Z" />
      <path d="M3.33301 11.9817C2.60186 11.9453 2.14574 11.8365 1.82116 11.5119C1.49658 11.1873 1.38782 10.7312 1.35137 10.0001M5.99967 12.0001H9.99967M12.6663 11.9817C13.3975 11.9453 13.8536 11.8365 14.1782 11.5119C14.6663 11.0237 14.6663 10.2381 14.6663 8.66675V7.33341H11.533C11.0367 7.33341 10.7885 7.33341 10.5877 7.26815C10.1817 7.13628 9.86347 6.81801 9.73161 6.4121C9.66634 6.21126 9.66634 5.96309 9.66634 5.46675C9.66634 4.72223 9.66634 4.34998 9.56847 4.04871C9.37061 3.43984 8.89327 2.96247 8.28441 2.76463C7.98314 2.66675 7.61087 2.66675 6.86634 2.66675H1.33301" />
      <path d="M1.33301 5.33325H5.33301" />
      <path d="M1.33301 7.33325H3.99967" />
      <path d="M9.66699 4H10.8811C11.8514 4 12.3365 4 12.7313 4.23581C13.1261 4.47161 13.3561 4.89874 13.8161 5.753L14.667 7.33333" />
    </svg>
  );
}

type InternalTo = "/products" | "/about" | "/coa-archive" | "/contact" | "/track-order" | "/faq" | "/shipping-returns" | "/privacy-policy" | "/terms-of-service" | "/disclaimer";
type FooterLink =
  | { label: string; to: InternalTo }
  | { label: string; to: "/products"; category: string }
  | { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Metabolic Research", to: "/products", category: "Metabolic Research" },
      { label: "GH Research", to: "/products", category: "GH Research" },
      { label: "Neuro Research", to: "/products", category: "Neuro Research" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Certificates of Analysis", to: "/coa-archive" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping & Returns", to: "/shipping-returns" },
      { label: "Track Your Order", to: "/track-order" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/terms-of-service" },
      { label: "Disclaimer", to: "/disclaimer" },
    ],
  },
];

const TRUST_BADGES = [
  { icon: SecurityCheckIcon, label: "SSL Secured" },
  { icon: TestTubeIcon, label: "99%+ Purity" },
  { icon: TruckDeliveryIcon, label: "Same Day Shipping" },
];

function FooterNavLink({ link, light }: { link: FooterLink; light: boolean }) {
  const linkClass = light
    ? "text-sm text-slate-600 hover:text-slate-900 transition-colors"
    : "text-sm text-white/70 hover:text-white transition-colors";
  if ("href" in link) {
    return (
      <a href={link.href} className={linkClass}>
        {link.label}
      </a>
    );
  }
  if ("category" in link) {
    return (
      <Link to="/products" search={{ category: link.category }} className={linkClass}>
        {link.label}
      </Link>
    );
  }
  return (
    <Link to={link.to} className={linkClass}>
      {link.label}
    </Link>
  );
}

export function Footer({ light = false }: { light?: boolean }) {
  return (
    <footer
      className={`relative z-10 border-t backdrop-blur-md ${
        light
          ? "border-white bg-white/55 text-slate-800"
          : "border-white/10 bg-gradient-to-b from-[#102a57]/70 to-[#0a1f44]/85 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link
              to="/"
              aria-label="Simpletide — return to homepage"
              className={`inline-block rounded-sm text-3xl sm:text-4xl font-light tracking-widest transition-opacity hover:opacity-80 ${
                light ? "text-slate-800" : "text-white"
              }`}
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              }}
            >
              <span className="bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] bg-clip-text text-transparent">SIMPLE</span>TIDE
            </Link>
            <p className={`mt-4 max-w-xs text-sm leading-6 ${light ? "text-slate-500" : "text-white/60"}`}>
              Premium research-grade peptides for optimal controlled studies and performance. Third-party tested with Certificate of Analysis.
            </p>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className={`text-sm font-semibold mb-4 ${light ? "text-slate-800" : "text-white"}`}>{column.heading}</h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <FooterNavLink link={link} light={light} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-12 pt-8 border-t flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between ${light ? "border-slate-200" : "border-white/10"}`}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-start">
            {TRUST_BADGES.map((badge) => (
              <span key={badge.label} className={`flex items-center gap-2 text-xs ${light ? "text-slate-600" : "text-white/70"}`}>
                <badge.icon className={`w-4 h-4 ${light ? "text-violet-400" : "text-white/80"}`} />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <p className={`mt-10 text-center text-xs ${light ? "text-slate-400" : "text-white/50"}`}>
          © 2026 Simpletide. All rights reserved. For Research Use Only.
        </p>
      </div>
    </footer>
  );
}

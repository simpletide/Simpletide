import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/CartDrawer";
import { ResearcherGate } from "@/components/ResearcherGate";
import { Starfield } from "@/components/Starfield";
import { RainbowMist } from "@/components/RainbowMist";
import { Footer } from "@/components/Footer";
import { ChatBot } from "@/components/ChatBot";
import { DEFAULT_OG_IMAGE, SITE_ORIGIN } from "@/lib/site-seo";
import { Toaster } from "@/components/ui/sonner";


// Intercom messenger is parked while the in-house AI ChatBot owns the
// bottom-right corner. Flip this to true to restore Intercom (e.g. for
// human-handoff alongside the bot).
const ENABLE_INTERCOM = false;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
      { title: "Simpletide | Premium Research Compounds" },
      { name: "description", content: "Simpletide offers premium research compounds and lab-tested chemicals for scientific innovation." },
      { property: "og:title", content: "Simpletide | Premium Research Compounds" },
      { property: "og:description", content: "Simpletide offers premium research compounds and lab-tested chemicals for scientific innovation." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Simpletide" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Simpletide | Premium Research Compounds" },
      { name: "twitter:description", content: "Simpletide offers premium research compounds and lab-tested chemicals for scientific innovation." },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Simpletide",
              url: SITE_ORIGIN,
              description: "Premium research compounds and lab-tested chemicals for scientific innovation.",
            },
            {
              "@type": "WebSite",
              name: "Simpletide",
              url: SITE_ORIGIN,
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ENABLE_INTERCOM) return;
    if (typeof window === "undefined") return;
    if (document.getElementById("intercom-script")) return;

    const script = document.createElement("script");
    script.id = "intercom-script";
    script.innerHTML = `
      window.intercomSettings = { app_id: "lsw4wneg" };
      (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/lsw4wneg';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
    `;
    document.body.appendChild(script);
  }, []);

  const showFooter = !pathname.startsWith("/auth");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RainbowMist />
          <Starfield pastel />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          {showFooter && <Footer light />}
          <CartDrawer />
          <ResearcherGate />
          <ChatBot />
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

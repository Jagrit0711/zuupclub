import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  notFound,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { ClubPublicPortal } from "../components/club-portal";

const getTenantSlug = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const host = getRequestHost();
    if (!host) return null;
    
    let slug = null;
    if (host.includes(".club.zuup.dev")) {
      slug = host.split(".")[0];
    }
    // Local testing: byte.localhost:5173
    else if (host.includes(".localhost")) {
      slug = host.split(".")[0];
    }
    
    if (slug) {
      // Lazy import supabase so it works properly in server functions without global errors
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("clubs")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
        
      if (data) {
        return slug;
      } else {
        return "NOT_FOUND";
      }
    }
    
    return null;
  } catch (err) {
    return null;
  }
});

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
      { title: "Zuup Clubs — start a club your school actually remembers" },
      { name: "description", content: "Zuup gives student leaders a free website, certificates, workshops, curriculum and hackathons to run a club that matters. Apply to start one, or join a waitlist." },
      { name: "author", content: "Zuup" },
      { property: "og:title", content: "Zuup Clubs" },
      { property: "og:description", content: "A club your school actually remembers. Backed by Zuup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/brand/zuup-white.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" },
    ],
  }),
  beforeLoad: async () => {
    const tenantSlug = await getTenantSlug();
    if (tenantSlug === "NOT_FOUND") {
      throw notFound();
    }
    return { tenantSlug };
  },
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
  const { queryClient, tenantSlug } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {tenantSlug ? (
        <ClubPublicPortal slug={tenantSlug} />
      ) : (
        /* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */
        <Outlet />
      )}
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}

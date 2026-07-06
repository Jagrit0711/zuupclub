import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Zuup Clubs" },
      { name: "description", content: "Sign in to manage your Zuup club." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = useSearch({ from: "/auth" });

  useEffect(() => {
    // If a next URL was provided (e.g., to return to a subdomain), store it securely
    if (next) {
      document.cookie = `auth_next_url=${encodeURIComponent(next)}; domain=.zuup.dev; path=/; max-age=3600; secure; samesite=lax`;
      // Also store it for localhost testing
      document.cookie = `auth_next_url_local=${encodeURIComponent(next)}; path=/; max-age=3600; samesite=lax`;
    }

    // Redirect to the centralized Zuup Auth gateway
    const callbackUri = encodeURIComponent(`${window.location.origin}/callback`);
    // Passing both redirect_uri and redirect_to to ensure the Gateway catches it.
    window.location.href = `https://auth.zuup.dev/login?client_id=zuupclubs&redirect_uri=${callbackUri}&redirect_to=${callbackUri}`;
  }, [next]);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      <SiteNav />
      <section className="relative px-6 flex-1 flex flex-col items-center justify-center">
        <div aria-hidden className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-lime/10 blur-3xl pointer-events-none" />
        <div className="relative w-full max-w-md mx-auto text-center z-10">
          <div className="w-10 h-10 border-2 border-lime border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="font-display text-4xl text-ink leading-tight mb-2">
            Taking you to <span className="italic text-lime">Zuup Auth</span>
          </h1>
          <p className="text-ink-soft">Redirecting securely...</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

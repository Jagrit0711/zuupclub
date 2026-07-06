import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Field, SubmitBtn } from "@/components/ui/field";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

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
  const nav = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const full_name = String(fd.get("full_name") ?? "").trim();
    if (!email || !password) return toast.error("Email and password are required.");
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name },
            emailRedirectTo: `${window.location.origin}${next ?? "/dashboard"}`,
          },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: next ?? "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      nav({ to: next ?? "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-36 pb-24 min-h-[calc(100svh-8rem)] flex items-center">
        <div aria-hidden className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-lime/10 blur-3xl" />
        <div className="relative w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-4">Zuup Clubs</p>
            <h1 className="font-display text-5xl text-ink leading-[0.9]">
              {mode === "in" ? <>Welcome <span className="italic text-lime">back.</span></> : <>Make an <span className="italic text-lime">account.</span></>}
            </h1>
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="w-full h-13 py-3.5 mb-5 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-ink font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
          >
            <GoogleG /> Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">or email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "up" && <Field name="full_name" label="Full name" required placeholder="Ada Lovelace" />}
            <Field name="email" label="Email" type="email" required placeholder="you@school.edu" />
            <Field name="password" label="Password" type="password" required minLength={6} placeholder="At least 6 characters" />
            <SubmitBtn type="submit" loading={busy} className="w-full">
              {mode === "in" ? "Sign in" : "Create account"}
            </SubmitBtn>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {mode === "in" ? (
              <>New here?{" "}
                <button onClick={() => setMode("up")} className="text-lime hover:underline font-medium">Create an account</button>
              </>
            ) : (
              <>Already have one?{" "}
                <button onClick={() => setMode("in")} className="text-lime hover:underline font-medium">Sign in</button>
              </>
            )}
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.3 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5c-7.4 0-13.8 4.1-17.7 10.2z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.3-4.3 2.1-7 2.1-5.4 0-9.9-3.2-11.4-7.9l-6.5 5C9.9 39.2 16.4 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5.1c4.2-3.9 6.7-9.6 6.7-16.1 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

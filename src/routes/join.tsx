import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a club — Zuup Clubs" },
      { name: "description", content: "Enter your club's join link or code to become a member." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      toast.error("Join code must be 6 characters.");
      return;
    }

    setBusy(true);
    // Look up which club owns this code to get the slug
    const { data, error } = await supabase
      .from("clubs")
      .select("slug, proposed_name")
      .eq("join_code", cleanCode)
      .single();
    setBusy(false);

    if (error || !data?.slug) {
      toast.error("No club found with that code. Check the code and try again.");
      return;
    }

    // Redirect to that club's subdomain with the code pre-filled
    const isLocal = window.location.hostname.includes("localhost");
    if (isLocal) {
      // In local dev we can't do real subdomain routing, so show a message
      toast.success(`Code is for "${data.proposed_name}" — use their direct invite link to join.`);
    } else {
      window.location.href = `https://${data.slug}.club.zuup.dev?code=${cleanCode}`;
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-36 pb-24">
        <div aria-hidden className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full bg-lilac/12 blur-3xl" />
        <div className="relative max-w-xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lilac mb-4">Join a Club</p>
          <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-5">
            Enter your <span className="italic text-lilac">code.</span>
          </h1>
          <p className="text-ink-soft text-lg mb-10 max-w-md mx-auto">
            Got a join code from your club leader? Enter it below and we'll take you straight to your club.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-char code"
              maxLength={6}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-full px-6 py-4 text-ink placeholder:text-ink-dim/60 focus:outline-none focus:border-lilac/60 font-mono uppercase tracking-widest text-center transition-all"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="h-14 px-7 rounded-full bg-lime text-black font-semibold hover:scale-[1.03] disabled:opacity-60 transition-transform"
            >
              {busy ? "Looking up…" : "Go →"}
            </button>
          </form>

          <p className="text-ink-dim text-sm mt-8">
            Don't have a code? Ask your club leader for their invite link, or{" "}
            <a href="/apply" className="text-lime hover:underline">start your own club</a>.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

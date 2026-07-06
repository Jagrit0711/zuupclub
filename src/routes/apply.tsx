import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Field, SubmitBtn } from "@/components/ui/field";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Start your club — Zuup Clubs" },
      { name: "description", content: "Tell us about you and the club you want to build." },
    ],
  }),
  component: ApplyPage,
});

const schema = z.object({
  school: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  grade: z.string().trim().max(60).optional().or(z.literal("")),
  proposed_name: z.string().trim().min(1).max(120),
  why: z.string().trim().min(1).max(2000),
});

function ApplyPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/auth", search: { next: "/apply" } });
    }
  }, [user, loading, nav]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setBusy(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error("You must be logged in to apply.");

      const { error: clubErr } = await supabase.from("clubs").insert({
        leader_id: userId,
        school: parsed.data.school,
        city: parsed.data.city,
        grade: parsed.data.grade || null,
        proposed_name: parsed.data.proposed_name,
        why: parsed.data.why,
      });
      if (clubErr) throw clubErr;

      toast.success("You're in! Check your dashboard to start gathering interested students.");
      nav({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-36 pb-24">
        <div aria-hidden className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-lime/12 blur-3xl" />
        <div aria-hidden className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-coral/10 blur-3xl" />

        <div className="relative max-w-2xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lime mb-4">Apply</p>
          <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-5">
            Start your <span className="italic text-lime">club.</span>
          </h1>
          <p className="text-ink-soft text-lg mb-12 max-w-md">
            Tell us a bit about you and the club you want to build.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field name="school" label="School / college name" required placeholder="Lincoln High" />
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="city" label="City" required placeholder="San Francisco" />
              <Field name="grade" label="Grade / year" placeholder="11th / Sophomore" />
            </div>
            <Field name="proposed_name" label="Proposed club name" required placeholder="Lincoln Builders Club" />
            <Field
              as="textarea"
              name="why"
              label="Why do you want to start this club?"
              required
              rows={5}
              placeholder="One paragraph. Be honest."
              className="resize-none"
            />

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <SubmitBtn type="submit" loading={busy}>Submit application</SubmitBtn>
              <p className="text-xs text-ink-dim">By applying you agree to hear from Zuup. That's it.</p>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

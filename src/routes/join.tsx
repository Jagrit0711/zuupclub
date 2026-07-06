import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Field, SubmitBtn } from "@/components/ui/field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a club — Zuup Clubs" },
      { name: "description", content: "Find a club starting at your school and be one of the first to join." },
    ],
  }),
  component: JoinPage,
});

type Club = {
  id: string;
  proposed_name: string;
  school: string;
  city: string;
  status: "waitlist" | "pending" | "approved" | "rejected";
};

const schema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  school: z.string().trim().min(1).max(200),
  club_id: z.string().uuid(),
});

function JoinPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Club | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("clubs")
      .select("id, proposed_name, school, city, status")
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .then(({ data }) => setClubs((data as Club[] | null) ?? []));
  }, []);

  const filtered = clubs.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      c.proposed_name.toLowerCase().includes(s) ||
      c.school.toLowerCase().includes(s) ||
      c.city.toLowerCase().includes(s)
    );
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      full_name: fd.get("full_name"),
      email: fd.get("email"),
      school: fd.get("school"),
      club_id: selected.id,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("waitlist_signups").insert(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("You're on the list! We'll keep you posted as your club takes off.");
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-36 pb-24">
        <div aria-hidden className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full bg-lilac/12 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lilac mb-4">Waitlist</p>
          <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-5">
            Join a <span className="italic text-lilac">club.</span>
          </h1>
          <p className="text-ink-soft text-lg mb-10 max-w-md">
            Find a club starting at your school and be one of the first to join.
          </p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by club, school, or city…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-full px-6 py-4 text-ink placeholder:text-ink-dim/60 focus:outline-none focus:border-lilac/60 focus:bg-white/[0.06] transition-all mb-8"
          />

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-ink-soft">No clubs yet at that search — check back soon, or</p>
              <a href="/apply" className="text-lime font-semibold hover:underline">start one yourself →</a>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { setSelected(c); setDone(false); }}
                    className="w-full text-left group rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-lilac/30 p-6 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-display text-2xl text-ink leading-tight">{c.proposed_name}</h3>
                      <StatusPill s={c.status} />
                    </div>
                    <p className="text-ink-soft text-sm">{c.school} · {c.city}</p>
                    <p className="mt-4 text-[13px] text-lilac font-medium">Join waitlist →</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selected && (
        <JoinDialog
          club={selected}
          onClose={() => { setSelected(null); setDone(false); }}
          onSubmit={handleSubmit}
          busy={busy}
          done={done}
        />
      )}

      <SiteFooter />
    </main>
  );
}

function StatusPill({ s }: { s: Club["status"] }) {
  const map = {
    waitlist: "bg-coral/15 text-coral border-coral/30",
    pending: "bg-lilac/15 text-lilac border-lilac/30",
    approved: "bg-lime/15 text-lime border-lime/30",
    rejected: "bg-white/5 text-ink-dim border-white/10",
  } as const;
  const label = { waitlist: "Recruiting", pending: "In review", approved: "Live", rejected: "Closed" }[s];
  return <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full border ${map[s]}`}>{label}</span>;
}

function JoinDialog({
  club,
  onClose,
  onSubmit,
  busy,
  done,
}: {
  club: Club;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  done: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-soft-rise">
      <div className="w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Joining</p>
            <h2 className="font-display text-3xl text-ink leading-tight">{club.proposed_name}</h2>
            <p className="text-sm text-ink-soft mt-1">{club.school}</p>
          </div>
          <button onClick={onClose} className="size-9 rounded-full border border-white/15 text-ink-soft hover:text-ink hover:border-white/30 grid place-items-center transition-colors" aria-label="Close">✕</button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 size-14 rounded-full bg-lime grid place-items-center text-black text-2xl">✓</div>
            <p className="font-display text-2xl text-ink mb-2">You're on the list!</p>
            <p className="text-ink-soft">We'll keep you posted as your club takes off.</p>
            <button onClick={onClose} className="mt-8 h-12 px-6 rounded-full border border-white/15 text-ink hover:bg-white/5">Done</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field name="full_name" label="Full name" required placeholder="Ada Lovelace" />
            <Field name="email" label="Email" type="email" required placeholder="you@school.edu" />
            <Field name="school" label="School / college" required defaultValue={club.school} />
            <div className="pt-2">
              <SubmitBtn type="submit" loading={busy}>Join the waitlist</SubmitBtn>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteNav, useSignOut } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Field, SubmitBtn } from "@/components/ui/field";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your club — Zuup Clubs" }] }),
  component: DashboardPage,
});

type Club = {
  id: string;
  proposed_name: string;
  school: string;
  city: string;
  status: "waitlist" | "pending" | "approved" | "rejected";
  teacher_name: string | null;
  teacher_approved: boolean;
  admin_notes: string | null;
  created_at: string;
};

type Signup = { id: string; full_name: string; email: string; created_at: string };

function DashboardPage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const [club, setClub] = useState<Club | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTeacher, setSavingTeacher] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: c } = await supabase
        .from("clubs")
        .select("id, proposed_name, school, city, status, teacher_name, teacher_approved, admin_notes, created_at")
        .eq("leader_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setClub(c as Club | null);
      if (c) {
        const { data: s } = await supabase
          .from("waitlist_signups")
          .select("id, full_name, email, created_at")
          .eq("club_id", c.id)
          .order("created_at", { ascending: false });
        setSignups((s as Signup[] | null) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  async function saveTeacher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!club) return;
    const fd = new FormData(e.currentTarget);
    const teacher_name = String(fd.get("teacher_name") ?? "").trim();
    const teacher_approved = fd.get("teacher_approved") === "yes";
    setSavingTeacher(true);
    const readyForReview = signups.length >= 5 && teacher_approved;
    const patch: Partial<Club> = {
      teacher_name: teacher_name || null,
      teacher_approved,
      status: readyForReview && club.status === "waitlist" ? "pending" : club.status,
    };
    const { error } = await supabase.from("clubs").update(patch).eq("id", club.id);
    setSavingTeacher(false);
    if (error) return toast.error(error.message);
    setClub({ ...club, ...patch } as Club);
    toast.success(readyForReview ? "Flagged for Zuup review 🎉" : "Saved.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="pt-40 text-center text-ink-dim">Loading your club…</div>
      </main>
    );
  }

  if (!club) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="relative px-6 pt-36 pb-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-5xl sm:text-6xl text-ink mb-6">You haven't applied yet.</h1>
            <p className="text-ink-soft mb-10">Fill out a two-minute application and this dashboard lights up.</p>
            <Link to="/apply" className="inline-flex h-14 px-8 rounded-full bg-lime text-black font-semibold items-center gap-2 hover:scale-[1.03] transition-transform">
              Apply to start a club →
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const count = signups.length;
  const pct = Math.min(100, Math.round((count / 5) * 100));
  const readyFlag = count >= 5 && club.teacher_approved;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join` : "";

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-32 pb-16">
        <div aria-hidden className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full bg-lime/12 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim">Your club</p>
            <button onClick={signOut} className="text-[12px] text-ink-dim hover:text-ink underline underline-offset-4">Sign out</button>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-4">{club.proposed_name}</h1>
          <p className="text-ink-soft">{club.school} · {club.city}</p>

          {/* Pipeline */}
          <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
            <PipelineStep active={club.status === "waitlist"} done={["pending","approved"].includes(club.status)} label="Waitlist" color="coral" />
            <PipelineStep active={club.status === "pending"}  done={club.status === "approved"} label="Pending Approval" color="lilac" />
            <PipelineStep active={club.status === "approved"} done={false} label="Approved" color="lime" />
          </div>

          {readyFlag && club.status === "waitlist" && (
            <div className="mt-6 rounded-2xl border border-lime/30 bg-lime/10 px-5 py-4 flex items-center gap-3">
              <span className="size-2 rounded-full bg-lime animate-shimmer" />
              <p className="text-ink font-medium">Ready for Zuup review — save your teacher info below to lock it in.</p>
            </div>
          )}

          {/* Progress + Signups */}
          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Interested students</p>
                  <p className="font-display text-6xl sm:text-7xl text-ink leading-none">
                    {count}<span className="text-ink-dim">/5</span>
                  </p>
                </div>
                {count >= 5 ? (
                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full bg-lime text-black">Goal hit ✿</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full bg-white/5 text-ink-soft border border-white/10">{5 - count} to go</span>
                )}
              </div>
              <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full bg-lime rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied. Send it to your friends.");
                  }}
                  className="h-11 px-5 rounded-full border border-white/15 hover:bg-white/5 text-ink text-sm font-medium transition-colors"
                >
                  Copy share link
                </button>
                <a href={shareUrl} target="_blank" rel="noreferrer" className="text-sm text-ink-dim self-center hover:text-ink">
                  {shareUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-4">Recent signups</p>
              {signups.length === 0 ? (
                <p className="text-ink-soft text-sm leading-relaxed">
                  No students yet — share your club link to start gathering interest.
                </p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-auto pr-2">
                  {signups.slice(0, 8).map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-lime/20 text-lime grid place-items-center text-xs font-bold uppercase">
                        {s.full_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-ink truncate">{s.full_name}</p>
                        <p className="text-xs text-ink-dim truncate">{s.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Teacher approval */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Approval</p>
            <h2 className="font-display text-3xl text-ink mb-6">Teacher / principal approval</h2>
            <form onSubmit={saveTeacher} className="space-y-4">
              <Field name="teacher_name" label="Authority name" defaultValue={club.teacher_name ?? ""} placeholder="Ms. Rivera, Principal" />
              <div>
                <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-2">Approved?</span>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input type="radio" name="teacher_approved" value="yes" defaultChecked={club.teacher_approved} className="peer sr-only" />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-ink cursor-pointer peer-checked:bg-lime peer-checked:text-black peer-checked:border-lime transition-all">Yes</div>
                  </label>
                  <label className="flex-1">
                    <input type="radio" name="teacher_approved" value="no" defaultChecked={!club.teacher_approved} className="peer sr-only" />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-ink cursor-pointer peer-checked:bg-white peer-checked:text-black peer-checked:border-white transition-all">Not yet</div>
                  </label>
                </div>
              </div>
              <SubmitBtn type="submit" loading={savingTeacher}>Save approval</SubmitBtn>
            </form>
          </div>

          {club.admin_notes && (
            <div className="mt-6 rounded-3xl border border-lilac/30 bg-lilac/10 p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-lilac mb-2">A note from Zuup</p>
              <p className="text-ink">{club.admin_notes}</p>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PipelineStep({ label, active, done, color }: { label: string; active: boolean; done: boolean; color: "coral" | "lilac" | "lime" }) {
  const activeCls =
    color === "coral" ? "bg-coral text-black border-coral" :
    color === "lilac" ? "bg-lilac text-black border-lilac" :
    "bg-lime text-black border-lime";
  const doneCls = "bg-white/5 text-ink-soft border-white/10 line-through decoration-2 decoration-ink-dim/40";
  const idleCls = "bg-white/[0.02] text-ink-dim border-white/10";
  const cls = active ? activeCls : done ? doneCls : idleCls;
  return (
    <div className={`rounded-2xl border px-4 py-4 text-center transition-all ${cls}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-semibold">{label}</p>
    </div>
  );
}

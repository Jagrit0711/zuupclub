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
  slug: string;
  join_code: string;
  grade: string | null;
  created_at: string;
};

// A row from club_members joined with profiles
type Member = {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: { full_name: string | null; email: string } | null;
};

function DashboardPage() {
  const { user } = useAuth();
  const signOut = useSignOut();

  // Leader state
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Member-only state (joined someone else's club)
  const [memberOfClub, setMemberOfClub] = useState<Pick<Club, "id" | "proposed_name" | "school" | "city"> | null>(null);

  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Letter Generator State
  const [letterType, setLetterType] = useState<"principal" | "teacher">("principal");
  const [letterName, setLetterName] = useState("");
  const [letterEmail, setLetterEmail] = useState("");
  const [showSharePop, setShowSharePop] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // ── 1. Am I a leader? ──────────────────────────────────────────────────
      const { data: leaderClub } = await supabase
        .from("clubs")
        .select("id, proposed_name, school, city, status, teacher_name, teacher_approved, admin_notes, slug, join_code, grade, created_at")
        .eq("leader_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leaderClub) {
        setIsLeader(true);
        setClub(leaderClub as Club);

        // Fetch club_members for THIS club, joined with profiles for display
        const { data: m } = await supabase
          .from("club_members")
          .select("id, user_id, joined_at, profiles(full_name, email)")
          .eq("club_id", leaderClub.id)
          .order("joined_at", { ascending: false });

        setMembers((m as unknown as Member[]) ?? []);
        setLoading(false);
        return;
      }

      // ── 2. Am I a member (joined via share link)? ──────────────────────────
      const { data: membership } = await supabase
        .from("club_members")
        .select("club_id, clubs(id, proposed_name, school, city)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.clubs) {
        setMemberOfClub(membership.clubs as unknown as Pick<Club, "id" | "proposed_name" | "school" | "city">);
      }

      setIsLeader(false);
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
    const readyForReview = members.length >= 5 && teacher_approved;
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

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="pt-40 text-center text-ink-dim">Loading your club…</div>
      </main>
    );
  }

  // ── Member dashboard (joined but not leader) ────────────────────────────────
  if (!isLeader) {
    if (memberOfClub) {
      return (
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
          <SiteNav />
          <section className="relative px-6 pt-32 pb-24">
            <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-lilac/10 blur-3xl" />
            <div className="relative max-w-2xl mx-auto text-center">
              <div className="flex justify-end mb-8">
                <button onClick={signOut} className="text-[12px] text-ink-dim hover:text-ink underline underline-offset-4">Sign out</button>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lilac/30 bg-lilac/10 text-lilac text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
                <span className="size-1.5 rounded-full bg-lilac animate-pulse" />
                Member
              </div>

              <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-4">
                {memberOfClub.proposed_name}
              </h1>
              <p className="text-ink-soft mb-12">{memberOfClub.school} · {memberOfClub.city}</p>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 sm:p-14 relative overflow-hidden">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(161,114,255,0.05)_0%,transparent_70%)]" />
                <div className="relative">
                  <div className="mx-auto mb-6 size-16 rounded-2xl bg-lilac/15 border border-lilac/20 grid place-items-center text-3xl">🚧</div>
                  <h2 className="font-display text-3xl text-ink mb-3">In Development</h2>
                  <p className="text-ink-soft leading-relaxed max-w-sm mx-auto">
                    Your member dashboard is on its way. More details — curriculum, events, and club updates — will be available soon.
                  </p>
                  <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-ink-dim text-sm">
                    <span className="size-1.5 rounded-full bg-lime animate-pulse" />
                    Coming soon
                  </div>
                </div>
              </div>
            </div>
          </section>
          <SiteFooter />
        </main>
      );
    }

    // Not a leader and not a member
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="px-6 pt-36 pb-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-5xl sm:text-6xl text-ink mb-6">You're not in a club yet.</h1>
            <p className="text-ink-soft mb-10">Start one yourself, or use a join link from your club leader.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/apply" className="inline-flex h-14 px-8 rounded-full bg-lime text-black font-semibold items-center gap-2 hover:scale-[1.03] transition-transform">
                Apply to start a club →
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  // ── Leader dashboard ────────────────────────────────────────────────────────
  if (!club) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="px-6 pt-36 pb-24">
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

  const count = members.length;
  const pct = Math.min(100, Math.round((count / 5) * 100));
  const readyFlag = count >= 5 && club.teacher_approved;
  const shareUrl = `https://${club.slug}.club.zuup.dev?code=${club.join_code}`;

  return (
    <>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden print:hidden">
        <SiteNav />
        <section className="relative px-6 pt-32 pb-16">
          <div aria-hidden className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full bg-lime/12 blur-3xl" />
          <div className="relative max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim">Your club</p>
                <div className="px-2 py-0.5 rounded-full border border-lime/30 bg-lime/10 text-lime text-[10px] uppercase tracking-widest font-semibold">
                  {club.status === "approved" ? "Active" : club.status === "pending" ? "Pending" : "Waitlist"}
                </div>
              </div>
              <button onClick={signOut} className="text-[12px] text-ink-dim hover:text-ink underline underline-offset-4">Sign out</button>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[0.9] mb-4">{club.proposed_name}</h1>
            <p className="text-ink-soft">{club.school} · {club.city}</p>

            {/* Pipeline */}
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
              <PipelineStep active={club.status === "waitlist"} done={["pending","approved"].includes(club.status)} label="Waitlist" color="coral" />
              <PipelineStep active={club.status === "pending"} done={club.status === "approved"} label="Pending Approval" color="lilac" />
              <PipelineStep active={club.status === "approved"} done={false} label="Approved" color="lime" />
            </div>

            {readyFlag && club.status === "waitlist" && (
              <div className="mt-6 rounded-2xl border border-lime/30 bg-lime/10 px-5 py-4 flex items-center gap-3">
                <span className="size-2 rounded-full bg-lime animate-pulse" />
                <p className="text-ink font-medium">Ready for Zuup review — save your teacher info below to lock it in.</p>
              </div>
            )}

            {/* Members count + list */}
            <div className="mt-8 grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-4">
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Club members</p>
                      <p className="font-display text-6xl sm:text-7xl text-ink leading-none">
                        {count}<span className="text-ink-dim">/5</span>
                      </p>
                    </div>
                    <div className="mb-2">
                      {count >= 5 ? (
                        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full bg-lime text-black">Goal hit ✿</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full bg-white/5 text-ink-soft border border-white/10">{5 - count} to go</span>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Join Code</p>
                    <p className="font-mono text-2xl sm:text-3xl text-lime tracking-widest bg-lime/10 px-3 py-1 rounded-lg inline-block border border-lime/20">
                      {club.join_code}
                    </p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full bg-lime rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Invite link copied!"); }}
                    className="h-11 px-5 rounded-full border border-white/15 hover:bg-white/5 text-ink text-sm font-medium transition-colors"
                  >
                    Copy invite link
                  </button>
                  <span className="text-sm text-ink-dim self-center truncate">{club.slug}.club.zuup.dev?code={club.join_code}</span>
                </div>
              </div>

              {/* Member list */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-4">Members</p>
                {members.length === 0 ? (
                  <p className="text-ink-soft text-sm leading-relaxed">No members yet — share your invite link!</p>
                ) : (
                  <ul className="space-y-3 max-h-64 overflow-auto pr-2">
                    {members.slice(0, 8).map((m) => {
                      const name = m.profiles?.full_name ?? m.profiles?.email ?? "Member";
                      const email = m.profiles?.email ?? "";
                      return (
                        <li key={m.id} className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-lime/20 text-lime grid place-items-center text-xs font-bold uppercase">
                            {name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-ink truncate">{name}</p>
                            <p className="text-xs text-ink-dim truncate">{email}</p>
                          </div>
                        </li>
                      );
                    })}
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

            {/* Letter Generator */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Tools</p>
              <h2 className="font-display text-3xl text-ink mb-2">Generate Approval Letter</h2>
              <p className="text-ink-soft mb-6 text-sm">Need a formal letter for your school? Fill in the blanks and print instantly.</p>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-2">
                  <label className="flex-1">
                    <input type="radio" name="letter_type" value="principal" checked={letterType === "principal"} onChange={() => setLetterType("principal")} className="peer sr-only" />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-ink cursor-pointer peer-checked:bg-lime peer-checked:text-black peer-checked:border-lime transition-all">To Principal</div>
                  </label>
                  <label className="flex-1">
                    <input type="radio" name="letter_type" value="teacher" checked={letterType === "teacher"} onChange={() => setLetterType("teacher")} className="peer sr-only" />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-ink cursor-pointer peer-checked:bg-white peer-checked:text-black peer-checked:border-white transition-all">To Teacher</div>
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field name="letter_name" label={`${letterType === "principal" ? "Principal" : "Teacher"} Name`} value={letterName} onChange={(e) => setLetterName(e.target.value)} placeholder="Mr. Smith" />
                  <Field name="letter_email" label="Email (Optional)" value={letterEmail} onChange={(e) => setLetterEmail(e.target.value)} placeholder="principal@school.edu" />
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button onClick={() => window.print()} className="h-11 px-6 rounded-full bg-lime text-black font-semibold text-sm hover:scale-[1.02] transition-transform">
                    Download / Print PDF
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowSharePop(p => !p)} className="text-sm text-ink-dim hover:text-ink underline underline-offset-4">
                      At school?
                    </button>
                    {showSharePop && (
                      <div className="absolute bottom-full left-0 mb-3 w-72 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl p-4 z-50">
                        <button onClick={() => setShowSharePop(false)} className="absolute top-3 right-3 text-ink-dim hover:text-ink text-xs" aria-label="Close">✕</button>
                        <p className="text-ink font-semibold text-sm mb-1">Send this letter</p>
                        <p className="text-ink-dim text-xs mb-4 leading-relaxed">Share the link or send a pre-filled email.</p>
                        <div className="space-y-2">
                          <button
                            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); setShowSharePop(false); }}
                            className="w-full h-9 rounded-full border border-white/15 hover:bg-white/5 text-ink text-xs font-medium transition-colors"
                          >
                            Copy link for a student
                          </button>
                          <a
                            href={(() => {
                              const studentName = user?.user_metadata?.full_name ?? "Student";
                              const recipientLabel = letterType === "principal" ? "Principal" : "Teacher";
                              const subject = encodeURIComponent(`Approval: Zuup Tech Innovation Club at ${club.school}`);
                              const body = encodeURIComponent(`Dear ${letterName || `[${recipientLabel} Name]`},\n\nI am ${studentName}, a student in ${club.grade ?? "[Grade]"} at ${club.school}. I am writing to formally request your approval to establish a Zuup Tech Innovation Club at our school.\n\nZuup (zuup.dev) is a global student empowerment platform supporting over 11,000 students across multiple countries. The club would provide students with mentorship, a structured curriculum, verifiable certificates, and access to international hackathons, all at no cost to the institution.\n\nI have already completed the formal application and received an official authorisation letter from Jagrit Sachdev, Founder and CEO of Zuup. I would be glad to share it with you in person or via email.\n\nMight I request a few minutes of your time to discuss this further?\n\nYours sincerely,\n${studentName}\n${club.grade ?? ""}, ${club.school}\n${user?.email ?? ""}`);
                              return `mailto:${letterEmail}?subject=${subject}&body=${body}`;
                            })()}
                            onClick={() => setShowSharePop(false)}
                            className="w-full h-9 rounded-full bg-lime text-black text-xs font-semibold flex items-center justify-center hover:scale-[1.02] transition-transform"
                          >
                            Open pre-filled email
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

      <ApprovalLetter
        type={letterType}
        recipientName={letterName}
        studentName={user?.user_metadata?.full_name ?? "Student"}
        school={club.school}
        city={club.city}
        grade={club.grade ?? ""}
      />
    </>
  );
}

function PipelineStep({ label, active, done, color }: { label: string; active: boolean; done: boolean; color: "coral" | "lilac" | "lime" }) {
  const activeCls = color === "coral" ? "bg-coral text-black border-coral" : color === "lilac" ? "bg-lilac text-black border-lilac" : "bg-lime text-black border-lime";
  const doneCls = "bg-white/5 text-ink-soft border-white/10 line-through decoration-2 decoration-ink-dim/40";
  const idleCls = "bg-white/[0.02] text-ink-dim border-white/10";
  return (
    <div className={`rounded-2xl border px-4 py-4 text-center transition-all ${active ? activeCls : done ? doneCls : idleCls}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-semibold">{label}</p>
    </div>
  );
}

function ApprovalLetter({ type, recipientName, studentName, school, city, grade }: { type: "principal" | "teacher"; recipientName: string; studentName: string; school: string; city: string; grade: string }) {
  const recipient = recipientName || `[${type === "principal" ? "Principal" : "Teacher"} Name]`;
  return (
    <div className="hidden print:block text-black bg-white font-serif text-[15px] leading-[1.85]">
      <style>{`@media print { @page { margin: 18mm 20mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-30deg)", opacity: 0.045, pointerEvents: "none" }}>
        <img src="/brand/zuup-black.png" alt="" style={{ width: "520px" }} />
      </div>
      <div style={{ borderBottom: "2.5px solid #000", paddingBottom: "18px", marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <img src="/brand/zuup-black.png" alt="Zuup" style={{ height: "36px" }} />
        <div style={{ textAlign: "right", fontFamily: "sans-serif", fontSize: "11px", color: "#555", lineHeight: "1.6" }}>
          <div>jagrit@zuup.dev</div><div>support@zuup.dev</div>
        </div>
      </div>
      <p style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px" }}>
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <div style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px", lineHeight: "1.7" }}>
        <div style={{ fontWeight: 600 }}>{recipient}</div>
        {type === "principal" ? <><div>Principal, {school}</div><div>{city}</div></> : <div>{school}</div>}
      </div>
      <p style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px" }}>
        <strong>Subject: Official Authorisation: Establishment of a Zuup Tech Innovation Club at {school} under the Leadership of {studentName}</strong>
      </p>
      <p style={{ marginBottom: "24px", fontFamily: "sans-serif", fontSize: "14px" }}>Dear {recipient},</p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        I write to you on behalf of Zuup to formally notify your institution that <strong>{studentName}</strong>, presently in {grade || "[Grade / Class]"} at {school}, has been duly assessed, considered, and selected to establish and lead a Zuup Tech Innovation Club at your school. This correspondence serves as an official instrument of that authorisation.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        Zuup is a global youth empowerment platform presently serving upwards of 11,000 students and 3,000 active young builders across multiple countries. Founded upon the conviction that the deficiency facing ambitious young people is not one of talent but of access and structured guidance, Zuup exists to bridge that very gap.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        Upon formal approval, Zuup shall provide the following, entirely at no cost to the institution:
      </p>
      <div style={{ marginBottom: "24px" }}>
        {[
          { title: "Dedicated Club Platform", body: "A bespoke management portal and club website, purpose-built to support the club's day-to-day operations." },
          { title: "Structured Curriculum & Expert Mentorship", body: "A rigorous, practitioner-designed curriculum delivered through mentor-led workshops." },
          { title: "Verifiable Credentials", body: "Official, digitally verifiable Zuup certificates of participation." },
          { title: "International Events & Community Access", body: "Privileged entry to international hackathons, design challenges, and Zuup's global builder network." },
        ].map(({ title, body }) => (
          <div key={title} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#000", marginTop: "9px", flexShrink: 0 }} />
            <div style={{ textAlign: "justify" }}><strong>{title}:</strong> {body}</div>
          </div>
        ))}
      </div>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        The club shall be wholly student-led. Zuup assumes full responsibility for the curriculum, platform infrastructure, and supporting resources, placing no financial obligation or administrative burden upon the institution.
      </p>
      <p style={{ marginTop: "40px", marginBottom: "28px" }}>I thank you sincerely for your time and your continued investment in the development of your students.</p>
      <p style={{ marginBottom: "36px" }}>Yours faithfully,</p>
      <div>
        <img src="/signature.png" alt="Jagrit Sachdev signature" style={{ height: "52px", marginBottom: "8px", opacity: 0.9 }} />
        <div style={{ fontWeight: 700, fontSize: "17px" }}>Jagrit Sachdev</div>
        <div style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#555", marginTop: "3px" }}>Founder &amp; Chief Executive Officer, Zuup</div>
      </div>
    </div>
  );
}

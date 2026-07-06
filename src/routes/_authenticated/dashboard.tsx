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

type Signup = { id: string; full_name: string; email: string; created_at: string };

function DashboardPage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const [club, setClub] = useState<Club | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTeacher, setSavingTeacher] = useState(false);
  
  // Letter Generator State
  const [letterType, setLetterType] = useState<"principal" | "teacher">("principal");
  const [letterName, setLetterName] = useState("");
  const [letterPhone, setLetterPhone] = useState("");
  const [letterEmail, setLetterEmail] = useState("");
  const [showSharePop, setShowSharePop] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: c } = await supabase
        .from("clubs")
        .select("id, proposed_name, school, city, status, teacher_name, teacher_approved, admin_notes, slug, join_code, grade, created_at")
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
  const shareUrl = typeof window !== "undefined" ? `https://${club.slug}.club.zuup.dev/join?code=${club.join_code}` : "";

  return (
    <>
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden print:hidden">
      <SiteNav />
      <section className="relative px-6 pt-32 pb-16">
        <div aria-hidden className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full bg-lime/12 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-4">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Interested students</p>
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
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Invite link copied!");
                  }}
                  className="h-11 px-5 rounded-full border border-white/15 hover:bg-white/5 text-ink text-sm font-medium transition-colors"
                >
                  Copy invite link
                </button>
                <a href={shareUrl} target="_blank" rel="noreferrer" className="text-sm text-ink-dim self-center hover:text-ink truncate">
                  {club.slug}.club.zuup.dev
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

          {/* Letter Generator */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Tools</p>
            <h2 className="font-display text-3xl text-ink mb-2">Generate Approval Letter</h2>
            <p className="text-ink-soft mb-6 text-sm">Need a formal letter for your school? Fill in the blanks and print a perfectly formatted request instantly.</p>
            
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
                <Field name="letter_email" label={`${letterType === "principal" ? "Principal" : "Teacher"} Email (Optional)`} value={letterEmail} onChange={(e) => setLetterEmail(e.target.value)} placeholder="principal@school.edu" />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => window.print()}
                  className="h-11 px-6 rounded-full bg-lime text-black font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  Download / Print PDF
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowSharePop(p => !p)}
                    className="text-sm text-ink-dim hover:text-ink underline underline-offset-4 transition-colors"
                  >
                    At school?
                  </button>

                  {showSharePop && (
                    <div
                      className="absolute bottom-full left-0 mb-3 w-72 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl p-4 z-50"
                    >
                      <button
                        onClick={() => setShowSharePop(false)}
                        className="absolute top-3 right-3 text-ink-dim hover:text-ink text-xs"
                        aria-label="Close"
                      >✕</button>
                      <p className="text-ink font-semibold text-sm mb-1">Send this letter</p>
                      <p className="text-ink-dim text-xs mb-4 leading-relaxed">Share the print link with a student, or open a pre-filled email — the recipient just hits Send.</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Dashboard link copied! Share it with a student to print.");
                            setShowSharePop(false);
                          }}
                          className="w-full h-9 rounded-full border border-white/15 hover:bg-white/5 text-ink text-xs font-medium transition-colors"
                        >
                          Copy link for a student
                        </button>
                        <a
                          href={(() => {
                            const studentName = user?.user_metadata?.full_name ?? "Student";
                            const recipientLabel = letterType === "principal" ? "Principal" : "Teacher";
                            const subject = encodeURIComponent(`Approval: Zuup Tech Innovation Club at ${club.school}`);
                            const body = encodeURIComponent(
`Dear ${letterName || `[${recipientLabel} Name]`},

I am ${studentName}, a student in ${club.grade ?? "[Grade]"} at ${club.school}. I am writing to formally request your approval to establish a Zuup Tech Innovation Club at our school.

Zuup (zuup.dev) is a global student empowerment platform supporting over 11,000 students across multiple countries. The club would provide students with mentorship, a structured curriculum, verifiable certificates, and access to international hackathons, all at no cost to the institution.

I have already completed the formal application and received an official authorisation letter from Jagrit Sachdev, Founder and CEO of Zuup. I would be glad to share it with you in person or via email.

Might I request a few minutes of your time to discuss this further?

Yours sincerely,
${studentName}
${club.grade ?? ""}, ${club.school}
${user?.email ?? ""}`
                            );
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

function ApprovalLetter({
  type,
  recipientName,
  studentName,
  school,
  city,
  grade,
}: {
  type: "principal" | "teacher";
  recipientName: string;
  studentName: string;
  school: string;
  city: string;
  grade: string;
}) {
  const recipient = recipientName || `[${type === "principal" ? "Principal" : "Teacher"} Name]`;
  return (
    <div className="hidden print:block text-black bg-white font-serif text-[15px] leading-[1.85] relative">
      <style>{`
        @media print {
          @page {
            margin: 18mm 20mm 18mm 20mm;
            /* suppress browser-generated URL / timestamp */
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* hide browser header & footer (Chrome/Edge/Firefox) */
          html { height: 100%; }
        }
      `}</style>
      {/* ── WATERMARK ─────────────────────────────────── */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-30deg)",
        opacity: 0.045,
        pointerEvents: "none",
        zIndex: 0,
      }}>
        <img src="/brand/zuup-black.png" alt="" style={{ width: "520px" }} />
      </div>
      {/* ── HEADER ────────────────────────────────────── */}
      <div style={{ borderBottom: "2.5px solid #000", paddingBottom: "18px", marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <img src="/brand/zuup-black.png" alt="Zuup" style={{ height: "36px" }} />
        <div style={{ textAlign: "right", fontFamily: "sans-serif", fontSize: "11px", color: "#555", lineHeight: "1.6" }}>
          <div>jagrit@zuup.dev</div>
          <div>support@zuup.dev</div>
        </div>
      </div>

      {/* ── DATE ──────────────────────────────────────── */}
      <p style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px" }}>
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* ── RECIPIENT ADDRESS BLOCK ────────────────────── */}
      <div style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px", lineHeight: "1.7" }}>
        <div style={{ fontWeight: 600 }}>{recipient}</div>
        {type === "principal"
          ? <><div>Principal, {school}</div><div>{city}</div></>
          : <div>{school}</div>
        }
      </div>

      {/* ── SUBJECT ───────────────────────────────────── */}
      <p style={{ marginBottom: "28px", fontFamily: "sans-serif", fontSize: "14px" }}>
        <strong>Subject: Official Authorisation: Establishment of a Zuup Tech Innovation Club at {school} under the Leadership of {studentName}</strong>
      </p>

      {/* ── SALUTATION ─────────────────────────────────── */}
      <p style={{ marginBottom: "24px", fontFamily: "sans-serif", fontSize: "14px" }}>
        Dear {recipient},
      </p>


      {/* ── BODY ───────────────────────────────────────── */}
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        I write to you on behalf of Zuup to formally notify your institution that <strong>{studentName}</strong>, presently in {grade || "[Grade / Class]"} at {school}, has been duly assessed, considered, and selected to establish and lead a Zuup Tech Innovation Club at your school. This correspondence serves as an official instrument of that authorisation.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        Zuup is a global youth empowerment platform presently serving upwards of 11,000 students and 3,000 active young builders across multiple countries. Founded upon the conviction that the deficiency facing ambitious young people is not one of talent, but of access and structured guidance, Zuup exists to bridge that very gap, furnishing students with the institutional scaffolding, mentorship, and substantive project experience necessary to cultivate genuine, industry-relevant competence.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        Having reviewed {studentName}'s application with considerable care, we are confident in their readiness and resolve to steward this initiative with the seriousness it warrants. Upon formal approval, Zuup shall provide the following, entirely at no cost to the institution:
      </p>

      {/* ── BENEFITS LIST ─────────────────────────────── */}
      <div style={{ marginBottom: "24px" }}>
        {[
          { title: "Dedicated Club Platform", body: "A bespoke management portal and club website, purpose-built to support the club's day-to-day operations." },
          { title: "Structured Curriculum & Expert Mentorship", body: "A rigorous, practitioner-designed curriculum delivered through mentor-led workshops, equipping students to build real, deployable projects." },
          { title: "Verifiable Credentials", body: "Official, digitally verifiable Zuup certificates of participation, of material value to university and career applications." },
          { title: "International Events & Community Access", body: "Privileged entry to international hackathons, design challenges, and Zuup's global builder network spanning multiple countries." },
        ].map(({ title, body }) => (
          <div key={title} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#000", marginTop: "9px", flexShrink: 0 }} />
            <div style={{ textAlign: "justify" }}><strong>{title}:</strong> {body}</div>
          </div>
        ))}
      </div>

      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        The club shall be wholly student-led in its operation. Zuup assumes full responsibility for the curriculum, platform infrastructure, and supporting resources, with the deliberate intention of placing no financial obligation, no administrative encumbrance, and no burden of faculty oversight upon the institution. The request we extend to {school} is confined to: your formal institutional approval to operate, and, should it prove possible, the nomination of a faculty sponsor to assist in securing a meeting space and time.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        The value to your students is both immediate and enduring: transferable technical skills of genuine market relevance, cultivated leadership experience, and a portfolio of substantive work that carries weight in competitive university applications and beyond.
      </p>
      <p style={{ marginBottom: "18px", textAlign: "justify" }}>
        I am firmly persuaded that {school} stands to be a distinguished home for this initiative, and we are deeply committed to supporting {studentName} in realising it to the fullest extent. Should you wish to discuss any aspect of the programme in further detail, I should be very glad to hear from you directly.
      </p>

      {/* ── SIGN-OFF ──────────────────────────────────── */}
      <p style={{ marginTop: "40px", marginBottom: "28px" }}>
        I thank you sincerely for your time and your continued investment in the development of your students.
      </p>
      <p style={{ marginBottom: "36px" }}>Yours faithfully,</p>

      <div>
        <img src="/signature.png" alt="Jagrit Sachdev signature" style={{ height: "52px", marginBottom: "8px", opacity: 0.9 }} />
        <div style={{ fontWeight: 700, fontSize: "17px" }}>Jagrit Sachdev</div>
        <div style={{ fontFamily: "sans-serif", fontSize: "12px", color: "#555", marginTop: "3px" }}>Founder &amp; Chief Executive Officer, Zuup</div>
      </div>
    </div>
  );
}


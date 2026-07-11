import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteNav, useSignOut } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Club applications — Zuup Clubs Admin" }] }),
  component: AdminPage,
});

type ClubRow = {
  id: string;
  proposed_name: string;
  school: string;
  city: string;
  status: "waitlist" | "pending" | "approved" | "rejected";
  teacher_approved: boolean;
  teacher_name: string | null;
  admin_notes: string | null;
  created_at: string;
};

function AdminPage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ClubRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [editing, setEditing] = useState<ClubRow | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) return;

      const [{ data: clubs }, { data: memberRows }] = await Promise.all([
        supabase.from("clubs").select("*").order("created_at", { ascending: false }),
        supabase.from("club_members").select("club_id"),
      ]);
      setRows((clubs as ClubRow[] | null) ?? []);
      const cmap: Record<string, number> = {};
      (memberRows ?? []).forEach((r) => {
        const cid = r.club_id as string;
        cmap[cid] = (cmap[cid] ?? 0) + 1;
      });
      setCounts(cmap);
    })();
  }, [user]);

  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.city))).sort(), [rows]);
  const filtered = rows.filter((r) => (filterStatus === "all" || r.status === filterStatus) && (filterCity === "all" || r.city === filterCity));

  const stats = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const students = Object.values(counts).reduce((s, n) => s + n, 0);
    return { total, approved, pending, students };
  }, [rows, counts]);

  async function updateClub(id: string, patch: Partial<ClubRow>) {
    const { error } = await supabase.from("clubs").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (editing?.id === id) setEditing({ ...editing, ...patch });
    toast.success("Updated");
  }

  if (isAdmin === null) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <div className="pt-40 text-center text-ink-dim">Checking access…</div>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="pt-36 px-6">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="font-display text-4xl text-ink mb-4">Not authorized.</h1>
            <p className="text-ink-soft mb-8">This dashboard is for the Zuup team. If that's you, ask an admin to grant you access.</p>
            <Link to="/dashboard" className="inline-flex h-12 px-6 rounded-full bg-lime text-black font-semibold">Go to your dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <section className="relative px-6 pt-32 pb-16">
        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim">Admin</p>
            <button onClick={signOut} className="text-[12px] text-ink-dim hover:text-ink underline underline-offset-4">Sign out</button>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[0.9] mb-10">Club applications</h1>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <Stat label="Total clubs" value={stats.total} color="ink" />
            <Stat label="Interested students" value={stats.students} color="butter" />
            <Stat label="Approved" value={stats.approved} color="lime" />
            <Stat label="Pending" value={stats.pending} color="lilac" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <SelectPill label="Status" value={filterStatus} onChange={setFilterStatus} options={[
              { v: "all", l: "All statuses" },
              { v: "waitlist", l: "Waitlist" },
              { v: "pending", l: "Pending" },
              { v: "approved", l: "Approved" },
              { v: "rejected", l: "Rejected" },
            ]} />
            <SelectPill label="City" value={filterCity} onChange={setFilterCity} options={[{ v: "all", l: "All cities" }, ...cities.map((c) => ({ v: c, l: c }))]} />
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-white/10 overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-white/[0.03] text-[10px] uppercase tracking-[0.18em] text-ink-dim font-semibold">
              <div>Club name</div>
              <div>School</div>
              <div>City</div>
              <div>Students</div>
              <div>Approval</div>
              <div>Status</div>
              <div></div>
            </div>
            <ul className="divide-y divide-white/10">
              {filtered.length === 0 && (
                <li className="px-5 py-10 text-center text-ink-dim">No applications match these filters.</li>
              )}
              {filtered.map((r) => (
                <li key={r.id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-white/[0.02] items-center">
                  <div>
                    <p className="text-ink font-medium">{r.proposed_name}</p>
                    <p className="text-xs text-ink-dim md:hidden">{r.school} · {r.city}</p>
                  </div>
                  <div className="text-ink-soft text-sm hidden md:block">{r.school}</div>
                  <div className="text-ink-soft text-sm hidden md:block">{r.city}</div>
                  <div className="text-sm text-ink">{counts[r.id] ?? 0} / 5</div>
                  <div className="text-sm">{r.teacher_approved ? <span className="text-lime">✓ Yes</span> : <span className="text-ink-dim">—</span>}</div>
                  <div><StatusPill s={r.status} /></div>
                  <div className="flex gap-2 justify-start md:justify-end">
                    <button onClick={() => setEditing(r)} className="text-[12px] px-3 py-1.5 rounded-full border border-white/15 text-ink hover:bg-white/5">Manage</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {editing && (
        <ManageDialog club={editing} count={counts[editing.id] ?? 0} onClose={() => setEditing(null)} onUpdate={updateClub} />
      )}

      <SiteFooter />
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: "ink" | "lime" | "lilac" | "butter" }) {
  const map = { ink: "text-ink", lime: "text-lime", lilac: "text-lilac", butter: "text-butter" };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-2">{label}</p>
      <p className={`font-display text-4xl leading-none ${map[color]}`}>{value}</p>
    </div>
  );
}

function SelectPill({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full pl-4 pr-2 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-ink text-sm py-1 pr-6 focus:outline-none appearance-none">
        {options.map((o) => <option key={o.v} value={o.v} className="bg-black">{o.l}</option>)}
      </select>
    </label>
  );
}

function StatusPill({ s }: { s: ClubRow["status"] }) {
  const map = {
    waitlist: "bg-coral/15 text-coral border-coral/30",
    pending: "bg-lilac/15 text-lilac border-lilac/30",
    approved: "bg-lime/15 text-lime border-lime/30",
    rejected: "bg-white/5 text-ink-dim border-white/10",
  } as const;
  return <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full border ${map[s]}`}>{s}</span>;
}

function ManageDialog({ club, count, onClose, onUpdate }: { club: ClubRow; count: number; onClose: () => void; onUpdate: (id: string, patch: Partial<ClubRow>) => void }) {
  const [note, setNote] = useState(club.admin_notes ?? "");
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-soft-rise">
      <div className="w-full max-w-lg rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-1">Manage</p>
            <h2 className="font-display text-3xl text-ink leading-tight">{club.proposed_name}</h2>
            <p className="text-sm text-ink-soft mt-1">{club.school} · {club.city}</p>
          </div>
          <button onClick={onClose} className="size-9 rounded-full border border-white/15 text-ink-soft hover:text-ink grid place-items-center" aria-label="Close">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink-dim">Students</p>
            <p className="font-display text-2xl text-ink">{count}/5</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink-dim">Teacher</p>
            <p className="font-display text-2xl text-ink">{club.teacher_approved ? "✓" : "—"}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.18em] text-ink-dim">Leader</p>
            <p className="text-xs text-ink truncate mt-1.5">Club Leader</p>
          </div>
        </div>

        <div className="mb-5">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-dim mb-2">Notes to the leader</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything you want them to see on their dashboard…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-ink placeholder:text-ink-dim/60 focus:outline-none focus:border-lime/60 transition-all resize-none"
          />
          <button onClick={() => onUpdate(club.id, { admin_notes: note || null })} className="mt-2 text-xs text-lime hover:underline">Save note</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onUpdate(club.id, { status: "approved" })} className="h-11 rounded-full bg-lime text-black font-semibold text-sm hover:scale-[1.02] transition-transform">Approve</button>
          <button onClick={() => onUpdate(club.id, { status: "pending" })} className="h-11 rounded-full bg-lilac text-black font-semibold text-sm hover:scale-[1.02] transition-transform">Mark pending</button>
          <button onClick={() => onUpdate(club.id, { status: "rejected" })} className="h-11 rounded-full border border-white/15 text-ink text-sm hover:bg-white/5">Reject</button>
        </div>
      </div>
    </div>
  );
}

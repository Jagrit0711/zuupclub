import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteNav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 animate-soft-rise w-[calc(100%-1.5rem)] max-w-fit">
      <div
        className={`flex items-center gap-1 rounded-full border pl-2 pr-2 py-1.5 transition-all duration-500 ${
          scrolled
            ? "bg-black/70 backdrop-blur-xl border-white/12 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.8)]"
            : "bg-white/[0.05] backdrop-blur-xl border-white/10"
        }`}
      >
        <Link
          to="/"
          className="flex items-center justify-center h-9 w-auto px-2 shrink-0 hover:rotate-12 transition-transform duration-300"
          aria-label="Zuup home"
        >
          <img src="/brand/zuup-white.png" alt="" className="h-6 w-auto" />
        </Link>
        <NavItem to="/" label="Home" />
        <NavItem to="/#how" label="How" />
        <NavItem to="/#perks" label="Perks" />
        <NavItem to="/apply" label="Apply" />
        {user ? (
          <Link
            to="/dashboard"
            className="ml-1 h-9 px-4 rounded-full bg-lime text-black text-[13px] font-semibold flex items-center transition-transform hover:scale-[1.04] active:scale-[0.97]"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/join"
            className="ml-1 h-9 px-4 rounded-full bg-lime text-black text-[13px] font-semibold flex items-center transition-transform hover:scale-[1.04] active:scale-[0.97]"
          >
            Join a waitlist
          </Link>
        )}
      </div>
    </nav>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const isHash = to.includes("#");
  const cls =
    "px-3 sm:px-3.5 h-9 grid place-items-center rounded-full text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-white/5 transition-colors";
  if (isHash) return <a href={to} className={cls}>{label}</a>;
  return <Link to={to} className={cls}>{label}</Link>;
}

export function useSignOut() {
  return async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };
}

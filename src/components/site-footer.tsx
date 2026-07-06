import { Github, Youtube, Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative bg-[#050505] pt-24 pb-8 border-t border-white/10 overflow-hidden">
      {/* Grid Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Soft glows in background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-16 md:gap-8 mb-20">
        
        {/* Left Section: Logo, Tagline, Phone, Socials */}
        <div className="md:w-1/2 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src="/brand/zuup-white.png" alt="Zuup" className="h-10 w-auto" />
            <span className="font-display text-4xl text-white mt-1">Clubs</span>
          </div>

          <h3 className="font-serif italic text-2xl sm:text-3xl text-white mb-2 font-light">
            Where you get your chance.
          </h3>
          <p className="font-mono text-white/60 text-sm tracking-widest mb-8">
            +91 11368172199
          </p>

          <div className="flex gap-3">
            <SocialIcon href="https://github.com/jagrit0711" icon={<Github size={16} />} />
            <SocialIcon href="https://www.youtube.com/@joinzuup" icon={<Youtube size={16} />} />
            <SocialIcon href="https://www.instagram.com/joinzuup" icon={<Instagram size={16} />} />
            <SocialIcon href="https://joinzuup.substack.com/" icon={<Mail size={16} />} />
            <SocialIcon href="https://join.zuup.dev" icon={<MessageCircle size={16} />} />
          </div>
        </div>

        {/* Right Section: Link Columns */}
        <div className="md:w-1/2 grid grid-cols-2 gap-12 sm:gap-4 md:pl-20">
          <FooterCol title="Site" links={[
            { to: "/", label: "Home" },
            { to: "/apply", label: "Apply" },
            { to: "/#perks", label: "Perks" },
            { to: "/#faq", label: "FAQ" },
          ]}/>
          <FooterCol title="Ecosystem" links={[
            { href: "https://zuup.dev", label: "Main site" },
            { href: "https://zuup.dev/events", label: "Events" },
            { href: "https://join.zuup.dev", label: "Slack Community" },
            { href: "https://zuup.dev/privacy", label: "Privacy Policy" },
          ]}/>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-white/50 tracking-widest">
        <span>© {new Date().getFullYear()} Zuup.</span>
        <span>Made with <span className="text-coral">❤</span> by teens</span>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer"
      className="size-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition-all hover:scale-105"
    >
      {icon}
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ href?: string; to?: string; label: string }> }) {
  return (
    <div>
      <p className="font-display text-xl text-white mb-6">{title}</p>
      <ul className="space-y-4">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link to={l.to} className="text-sm text-white/60 hover:text-white transition-colors">
                {l.label}
              </Link>
            ) : (
              <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-white/60 hover:text-white transition-colors">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

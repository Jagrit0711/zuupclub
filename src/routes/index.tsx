import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import heroStudent from "@/assets/hero-student.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteNav />
      <Hero />
      <PortraitBand />
      <TrustBanner />
      <IntroStrip />
      <Perks />
      <HowItWorks />
      <WhyStart />
      <ThePromise />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

/* ------------------------------- Hero ------------------------------- */
function Hero() {
  const [showSchoolPop, setShowSchoolPop] = useState(false);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-32 pb-16 overflow-hidden">
      {/* colored glow blobs */}
      <div aria-hidden className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-lime/15 blur-[120px] animate-float-slow" />
      <div aria-hidden className="absolute top-40 -right-40 w-[520px] h-[520px] rounded-full bg-coral/15 blur-[120px] animate-float-slow" style={{ animationDelay: "-3s" }} />
      <div aria-hidden className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-lilac/10 blur-[120px] animate-float-slow" style={{ animationDelay: "-1.5s" }} />

      {/* floating stickers */}
      <div className="absolute inset-0 pointer-events-none w-full h-full max-w-7xl mx-auto z-20">
        {/* Top Right: it's free */}
        <div
          aria-hidden
          className="absolute top-24 sm:top-32 right-4 sm:right-8 lg:right-16 hidden sm:flex rotate-[8deg] animate-float-slow"
        >
          <div className="bg-zuup-pink text-white px-5 py-2 rounded-full shadow-[0_0_40px_-5px_#FF3D7F] font-display text-lg sm:text-xl">
            it's free ✿
          </div>
        </div>

        {/* Top Left: for students */}
        <div
          aria-hidden
          className="absolute top-32 sm:top-40 left-4 sm:left-8 lg:left-12 hidden md:flex -rotate-[12deg] animate-float-slow"
          style={{ animationDelay: "-0.8s" }}
        >
          <div className="bg-sky text-black border-2 border-transparent px-5 py-2 rounded-full shadow-2xl font-display text-lg sm:text-xl">
            for students 🎓
          </div>
        </div>

        {/* Bottom Left: student led */}
        <div
          aria-hidden
          className="absolute bottom-32 sm:bottom-40 left-2 sm:left-12 lg:left-24 hidden sm:flex -rotate-[6deg] animate-float-slow"
          style={{ animationDelay: "-2s" }}
        >
          <div className="bg-coral text-black border-2 border-transparent px-5 py-2 rounded-full shadow-[0_10px_30px_-8px_rgba(255,127,80,0.4)] font-display text-lg sm:text-xl">
            student led ✨
          </div>
        </div>

        {/* Bottom Right: learn from scratch */}
        <div
          aria-hidden
          className="absolute bottom-24 sm:bottom-32 right-2 sm:right-12 lg:right-24 hidden lg:flex rotate-[4deg] animate-float-slow"
          style={{ animationDelay: "-2.5s" }}
        >
          <div className="bg-[#111111] text-white border-2 border-white/10 px-5 py-2 rounded-full shadow-2xl font-display text-lg sm:text-xl backdrop-blur-md">
            learn from scratch 🌱
          </div>
        </div>
      </div>

      <p className="relative z-10 text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-6 animate-soft-rise">
        Zuup Clubs
      </p>

      <h1
        className="relative z-10 font-display text-center leading-[0.85] text-ink animate-wobble-in max-w-[16ch]"
        style={{ fontSize: "clamp(3.6rem, 13vw, 11rem)" }}
      >
        Start a club. <br />
        <span className="text-lime italic">Backed by Zuup.</span>
      </h1>

      <p
        className="relative z-10 mt-8 max-w-xl text-center text-[16px] sm:text-lg text-ink-soft leading-relaxed animate-soft-rise"
        style={{ animationDelay: "0.5s" }}
      >
        Student-led clubs at your school or college — with a free website,
        certificates, workshops, and a full curriculum. On us.
      </p>

      <div
        className="relative z-10 mt-10 flex flex-col sm:flex-row items-center gap-3 animate-soft-rise"
        style={{ animationDelay: "0.65s" }}
      >
        <Link
          to="/apply"
          className="group h-14 px-8 rounded-full bg-lime text-black text-[15px] font-semibold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-[0_10px_40px_-8px_rgba(255,61,127,0.4)]"
        >
          Apply to start a club
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </Link>
        <Link
          to="/join"
          className="h-14 px-7 rounded-full border border-white/15 text-ink text-[15px] font-medium hover:bg-white/5 transition-colors flex items-center"
        >
          Join a waitlist
        </Link>
      </div>

      <div
        className="relative z-20 mt-12 animate-soft-rise"
        style={{ animationDelay: "0.9s" }}
      >
        <div className="relative flex justify-center">
          <button
            onClick={() => setShowSchoolPop(p => !p)}
            className="text-[13px] text-ink-dim hover:text-ink underline underline-offset-4 transition-colors"
          >
            I am a school?
          </button>

          {showSchoolPop && (
            <div
              className="absolute bottom-full mb-3 w-[320px] rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl p-5 z-50 text-left"
            >
              <button
                onClick={() => setShowSchoolPop(false)}
                className="absolute top-3 right-3 text-ink-dim hover:text-ink text-xs p-1"
                aria-label="Close"
              >✕</button>
              <p className="text-ink font-semibold text-sm mb-1">Bring Zuup to your school</p>
              <p className="text-ink-dim text-xs mb-4 leading-relaxed">
                Empower your students with our free curriculum. Send a pre-filled email to get things started.
              </p>
              <div className="space-y-2">
                <a
                  href={`mailto:?subject=${encodeURIComponent("Proposal: Establishing a Zuup Tech Innovation Club at our school")}&body=${encodeURIComponent(
`Greetings [Student Name],

I was recently looking into youth technology initiatives and stumbled upon Zuup Clubs (clubs.zuup.dev). 

It is a completely free initiative backed by Zuup (zuup.dev), an international youth empowerment platform currently supporting over 11,000 active builders. The programme provides schools with a structured curriculum, a dedicated club website, verifiable digital credentials, and access to international hackathons. Crucially, the club is designed to be entirely student-led.

I genuinely like this idea and believe it would offer immense practical benefits to our student body, while simultaneously reflecting very well on our school's reputation for fostering innovation. 

Please take some time to review the platform. If you are interested, I would like you to apply to establish and lead this club at our school. Once you submit the application, I will gladly step in to serve as your official faculty sponsor.

Best regards,
[Your Name]
[Your Title]`
                  )}`}
                  onClick={() => setShowSchoolPop(false)}
                  className="w-full h-10 rounded-full border border-white/15 hover:bg-white/5 text-ink text-xs font-medium transition-colors flex items-center justify-center"
                >
                  Email a student
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent("Proposal: Establishing a Zuup Tech Innovation Club at our school")}&body=${encodeURIComponent(
`Greetings [Teacher Name],

I was recently looking into youth technology initiatives and stumbled upon Zuup Clubs (clubs.zuup.dev). 

It is a completely free initiative backed by Zuup (zuup.dev), an international youth empowerment platform currently supporting over 11,000 active builders. The programme provides schools with a structured curriculum, a dedicated club website, verifiable digital credentials, and access to international hackathons. Crucially, the club is designed to be entirely student-led, placing no administrative burden on the faculty.

I genuinely like this idea and believe it would offer immense practical benefits to our student body, while simultaneously reflecting very well on our school's reputation for fostering innovation. 

Please take some time to review the platform. I would like you to identify a promising student to apply and lead this initiative. Once they submit their application, I will formally authorise the club's establishment at our school.

Best regards,
[Your Name]
[Your Title]`
                  )}`}
                  onClick={() => setShowSchoolPop(false)}
                  className="w-full h-10 rounded-full bg-lime text-black text-xs font-semibold flex items-center justify-center hover:scale-[1.02] transition-transform"
                >
                  Email a teacher incharge
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="relative z-10 mt-14 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-dim animate-soft-rise"
        style={{ animationDelay: "1.1s" }}
      >
        <span className="size-1.5 rounded-full bg-lime animate-shimmer" />
        3,249 shipped a project last month at zuup
      </div>
    </section>
  );
}

/* ---------------------------- Portrait band ---------------------------- */
function PortraitBand() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className="relative w-full">
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] max-h-[92vh] overflow-hidden">
        <img
          src={heroStudent}
          alt="A student mid-laugh, running their club"
          width={1600}
          height={1200}
          className={`w-full h-full object-cover transition-all duration-[1800ms] ease-out ${
            visible ? "scale-100 opacity-100" : "scale-105 opacity-70"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50 pointer-events-none" />

        <div className="absolute bottom-6 sm:bottom-12 left-6 sm:left-12 max-w-sm">
          <p className="font-display text-xl sm:text-3xl text-ink leading-tight">
            "I didn't think I could run something. Then I did."
          </p>
        </div>

        <div className="absolute top-6 right-6 sm:top-10 sm:right-10 rotate-[6deg]">
          <div className="bg-lime text-black rounded-2xl px-4 py-2 font-display text-sm shadow-2xl">
            real students. real clubs.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Trust Banner ---------------------------- */
function TrustBanner() {
  return (
    <section className="px-6 py-12 sm:py-16 border-t border-white/10 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-4">
        <div className="flex flex-col items-center text-center md:w-1/3">
          <h4 className="font-display text-2xl text-ink mb-1">Non-Profit Initiative</h4>
          <p className="text-ink-soft text-[15px]">Mission-driven, not profit-driven.</p>
        </div>
        <div className="hidden md:block w-px h-12 bg-white/10" />
        <div className="flex flex-col items-center text-center md:w-1/3">
          <h4 className="font-display text-2xl text-ink mb-1">100% Free</h4>
          <p className="text-ink-soft text-[15px]">No hidden fees for students or schools.</p>
        </div>
        <div className="hidden md:block w-px h-12 bg-white/10" />
        <div className="flex flex-col items-center text-center md:w-1/3">
          <h4 className="font-display text-2xl text-ink mb-1">Privacy First</h4>
          <p className="text-ink-soft text-[15px]">We strictly protect student data.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Intro strip ---------------------------- */
function IntroStrip() {
  return (
    <section className="px-6 py-28 sm:py-40 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-24">
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl">
            <span className="text-ink">The </span>
            <span className="text-zuup-pink">deal.</span>
          </h2>
        </div>

        {/* Ledger split */}
        <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0">
          {/* Left: Student's side */}
          <div className="pr-0 md:pr-20 pb-16 md:pb-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zuup-pink mb-10 font-semibold">You</p>
            <div className="space-y-8">
              <p className="text-2xl sm:text-3xl text-ink leading-tight">Start a club at your school.</p>
              <p className="text-2xl sm:text-3xl text-ink leading-tight">Gather 5+ students.</p>
              <p className="text-2xl sm:text-3xl text-ink leading-tight">Get a teacher on board.</p>
              <p className="text-2xl sm:text-3xl text-ink-dim leading-tight italic">That's it.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block bg-white/10" />
          <div className="md:hidden h-px w-full bg-white/10 my-12" />

          {/* Right: Zuup's side */}
          <div className="pl-0 md:pl-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-lime mb-10 font-semibold">Zuup</p>
            <div className="space-y-8">
              <p className="text-2xl sm:text-3xl text-ink leading-tight">A free website on zuup.dev.</p>
              <p className="text-2xl sm:text-3xl text-ink leading-tight">A full curriculum to teach from.</p>
              <p className="text-2xl sm:text-3xl text-ink leading-tight">Mentors, certificates, events.</p>
              <p className="text-2xl sm:text-3xl text-lime leading-tight italic font-medium">All free.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Perks ---------------------------- */
const PERKS = [
  { tag: "Website", t: "Free club website / portal", d: "Yours. On zuup.dev. We build it, host it, keep it fast.", color: "lime", span: "md:col-span-2 md:row-span-2" },
  { tag: "Live", t: "Workshops led by mentors", d: "Weekly sessions with engineers, designers, founders — people who actually ship.", color: "lilac", span: "md:col-span-1 md:row-span-2" },
  { tag: "Content", t: "Full curriculum access", d: "Turn-key. You don't have to invent what to teach.", color: "sky", span: "md:col-span-2 md:row-span-1" },
  { tag: "Certs", t: "Certificates for members", d: "Real, signed. Colleges know what these are.", color: "coral", span: "md:col-span-1 md:row-span-1" },
  { tag: "Compete", t: "Hackathons & challenges", d: "Priority access, project funding, showcases.", color: "butter", span: "md:col-span-2 md:row-span-1" },
  { tag: "IRL", t: "Events & visits", d: "We handle food, prizes, logistics, hype. You show up.", color: "coral", span: "md:col-span-1 md:row-span-1" },
  { tag: "Counseling", t: "Higher ed counseling", d: "1:1 advice on college applications, essays, and CS programs.", color: "sky", span: "md:col-span-2 md:row-span-1" },
  { tag: "Research", t: "Research paper support", d: "Guidance on writing, formatting, and publishing.", color: "lilac", span: "md:col-span-1 md:row-span-1" },
  { tag: "Tech", t: "Cloud & DB hosting", d: "Free PostgreSQL databases and cloud hosting for your projects.", color: "lime", span: "md:col-span-2 md:row-span-1" },
  { tag: "Startup", t: "Startup mentorship", d: "Incubator-level support to take your project to a real company.", color: "butter", span: "md:col-span-1 md:row-span-1" },
];

function Perks() {
  return (
    <section id="perks" className="relative px-6 py-24 sm:py-40 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-6">The perks</p>
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.9] text-ink">
            Everything you need. <span className="italic text-lime">Free.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PERKS.map((p) => (
            <PerkCard key={p.t} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PerkCard({ tag, t, d, color, span }: { tag: string; t: string; d: string; color: string; span: string }) {
  const colorMap: Record<string, string> = {
    lime: "bg-[#0a0a0a] border-white/5 hover:border-lime/30",
    coral: "bg-[#0a0a0a] border-white/5 hover:border-coral/30",
    lilac: "bg-[#0a0a0a] border-white/5 hover:border-lilac/30",
    sky: "bg-[#0a0a0a] border-white/5 hover:border-sky/30",
    butter: "bg-[#0a0a0a] border-white/5 hover:border-butter/30",
  };
  const chipMap: Record<string, string> = {
    lime: "bg-lime/10 text-lime border border-lime/20",
    coral: "bg-coral/10 text-coral border border-coral/20",
    lilac: "bg-lilac/10 text-lilac border border-lilac/20",
    sky: "bg-sky/10 text-sky border border-sky/20",
    butter: "bg-butter/10 text-butter border border-butter/20",
  };
  return (
    <div className={`group relative rounded-[2rem] border overflow-hidden flex flex-col transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,61,127,0.1)] ${colorMap[color]} ${span}`}>
      <div className="p-8 sm:p-10 flex-shrink-0 z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-transparent z-[-1]" />
        <h3 className="font-display text-3xl sm:text-4xl text-ink leading-tight mb-3 mt-2">{t}</h3>
        <p className="text-ink-soft leading-relaxed max-w-md text-[15px]">{d}</p>
      </div>
      
      <div className="relative flex-grow flex items-center justify-center w-full mt-auto overflow-hidden border-t border-white/5 min-h-[250px]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent z-10 pointer-events-none" />
        <PerkWidget tag={tag} />
      </div>
    </div>
  );
}

function PerkWidget({ tag }: { tag: string }) {
  switch (tag) {
    case "Website":
      return (
        <div className="w-[85%] h-full mt-12 bg-[#111] border border-white/10 rounded-t-xl overflow-hidden shadow-2xl flex flex-col group-hover:-translate-y-4 transition-transform duration-700">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
            <div className="size-3 rounded-full bg-white/20" />
            <div className="size-3 rounded-full bg-white/20" />
            <div className="size-3 rounded-full bg-white/20" />
            <div className="ml-4 h-4 w-32 bg-white/5 rounded-full" />
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="h-6 w-1/3 bg-white/10 rounded" />
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-4/5 bg-white/5 rounded" />
            <div className="flex gap-3 mt-4">
              <div className="h-10 w-24 bg-lime/20 rounded-lg border border-lime/50" />
              <div className="h-10 w-24 bg-white/5 rounded-lg" />
            </div>
          </div>
        </div>
      );
    case "Live":
      return (
        <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
          <div className="flex -space-x-4">
            <div className="size-16 rounded-full border-4 border-[#0a0a0a] bg-zinc-800 flex items-center justify-center text-sm font-semibold animate-bounce" style={{animationDelay: "0s"}}>JD</div>
            <div className="size-16 rounded-full border-4 border-[#0a0a0a] bg-zinc-700 flex items-center justify-center text-sm font-semibold animate-bounce" style={{animationDelay: "0.2s"}}>SK</div>
            <div className="size-16 rounded-full border-4 border-[#0a0a0a] bg-zinc-600 flex items-center justify-center text-sm font-semibold animate-bounce" style={{animationDelay: "0.4s"}}>ML</div>
          </div>
          <div className="mt-6 text-[11px] uppercase tracking-widest text-lilac bg-lilac/10 px-3 py-1 rounded-full border border-lilac/20">Live Workshop</div>
        </div>
      );
    case "Content":
      return (
        <div className="flex flex-col gap-3 p-6 w-full max-w-sm mx-auto group-hover:scale-105 transition-transform duration-700 z-0">
          {['Intro to React', 'State Management', 'API Integration'].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className={`size-5 rounded-full border flex items-center justify-center ${i === 0 ? 'border-sky bg-sky/10' : 'border-white/20'}`}>
                {i === 0 && <div className="size-2.5 rounded-full bg-sky" />}
              </div>
              <span className={`text-[15px] ${i === 0 ? 'text-white' : 'text-white/60'}`}>{item}</span>
            </div>
          ))}
        </div>
      );
    case "Certs":
      return (
        <div className="flex justify-center items-center h-full w-full p-6">
          <div className="relative w-full max-w-[220px] aspect-[4/3] rounded-xl border border-coral/30 bg-coral/5 flex flex-col items-center justify-center group-hover:shadow-[0_0_40px_-5px_rgba(255,127,80,0.3)] group-hover:-rotate-3 transition-all duration-700 overflow-hidden">
            <div className="size-10 rounded-full bg-coral/20 border border-coral/50 mb-3 flex items-center justify-center text-coral text-xs">★</div>
            <div className="h-2 w-24 bg-coral/40 rounded mb-2" />
            <div className="h-1.5 w-16 bg-coral/20 rounded mb-4" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full ease-in-out" />
          </div>
        </div>
      );
    case "Compete":
      return (
        <div className="flex flex-col gap-2 p-6 w-full max-w-sm mx-auto group-hover:-translate-y-2 transition-transform duration-700 z-0">
          {['1. team_alpha', '2. syntax_error', '3. null_pointers'].map((team, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg border-b border-white/5 bg-white/[0.02]">
              <span className={`text-[15px] ${i===0 ? 'text-butter font-semibold' : 'text-white/60'}`}>{team}</span>
              <span className="text-xs text-white/40 font-mono">{1000 - i*150} pts</span>
            </div>
          ))}
        </div>
      );
    case "IRL":
      return (
        <div className="flex justify-center items-center h-full w-full p-6">
          <div className="relative w-full max-w-[240px] h-[100px] border-2 border-dashed border-white/20 bg-white/5 flex items-center px-6 group-hover:rotate-3 group-hover:scale-105 transition-all duration-700">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-[#0a0a0a] border-r-2 border-dashed border-white/20" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-[#0a0a0a] border-l-2 border-dashed border-white/20" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-coral mb-1">VIP Pass</span>
              <span className="text-lg font-display text-white">Zuup Meetup</span>
            </div>
            <div className="ml-auto w-8 h-12 flex justify-between">
               <div className="w-1 h-full bg-white/20" />
               <div className="w-2 h-full bg-white/20" />
               <div className="w-1 h-full bg-white/20" />
            </div>
          </div>
        </div>
      );
    case "Counseling":
      return (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[260px] bg-white text-black p-5 border border-white/10 group-hover:-translate-y-2 group-hover:rotate-1 transition-transform duration-700">
            <div className="flex justify-between items-center mb-6 border-b border-black/10 pb-4">
              <span className="font-mono text-xs font-bold uppercase">1:1 Strategy</span>
              <span className="font-mono text-xs">45 MIN</span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="size-8 bg-black/5 flex items-center justify-center font-mono text-[10px]">10</div>
                <div className="h-6 flex-1 bg-black/10" />
              </div>
              <div className="flex gap-3 items-center">
                <div className="size-8 bg-black text-white flex items-center justify-center font-mono text-[10px]">11</div>
                <div className="h-6 flex-1 bg-sky border border-sky flex items-center px-2">
                  <span className="text-[9px] font-bold uppercase text-white tracking-widest">Booked</span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="size-8 bg-black/5 flex items-center justify-center font-mono text-[10px]">12</div>
                <div className="h-6 flex-1 bg-black/10" />
              </div>
            </div>
          </div>
        </div>
      );
    case "Research":
      return (
        <div className="flex justify-center items-center h-full w-full p-6">
          <div className="w-[200px] bg-[#e5e5e5] p-6 shadow-xl group-hover:scale-105 transition-transform duration-700">
            <div className="h-1 w-full bg-black mb-1" />
            <div className="h-[2px] w-full bg-black mb-6" />
            <div className="h-3 w-4/5 bg-black mx-auto mb-2" />
            <div className="h-3 w-3/5 bg-black mx-auto mb-6" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="h-[2px] w-full bg-black/40" />
                <div className="h-[2px] w-full bg-black/40" />
                <div className="h-[2px] w-4/5 bg-black/40" />
              </div>
              <div className="space-y-1.5">
                <div className="h-[2px] w-full bg-black/40" />
                <div className="h-[2px] w-5/6 bg-black/40" />
              </div>
            </div>
            <div className="mt-4 border border-lilac border-dashed p-2">
              <div className="h-1 w-1/2 bg-lilac mb-1.5" />
              <div className="h-[2px] w-full bg-lilac/30" />
            </div>
          </div>
        </div>
      );
    case "Tech":
      return (
        <div className="w-full h-full p-8 flex flex-col justify-end font-mono text-[10px] sm:text-xs leading-tight text-lime/70 relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-700">
          <div className="absolute inset-0 bg-[#050505] -z-10" />
          <p className="text-white/40 mb-2">-- PostgreSQL Connection</p>
          <p>host=db.zuup.dev port=5432</p>
          <p>user=club_admin dbname=prod</p>
          <p className="mt-4 text-white/40">-- Deploying Next.js</p>
          <p>$ pnpm run build</p>
          <p>✓ Compiled successfully</p>
          <p>✓ Route (app)               Size</p>
          <p>  ├ /                       12kB</p>
          <p>  └ /api                    0kB</p>
          <p className="text-white mt-4">Ready in 2.4s.</p>
        </div>
      );
    case "Startup":
      return (
        <div className="flex justify-center items-center h-full w-full p-6">
          <div className="bg-[#111] border border-white/20 p-5 w-full max-w-[240px] font-mono text-xs group-hover:-translate-y-2 group-hover:rotate-1 transition-transform duration-700">
            <div className="border-b border-white/20 pb-2 mb-3">
              <span className="text-butter uppercase tracking-widest font-bold">Term Sheet</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-white/40">Valuation</span>
              <span className="text-white">$10M POST</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-white/40">Option Pool</span>
              <span className="text-white">15%</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-white/40">Lead Inv.</span>
              <span className="text-white">Zuup Cap</span>
            </div>
            <div className="w-full h-px bg-white/20 mb-3" />
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white/40">SIGNATURE</span>
              <span className="text-butter font-display text-sm tracking-widest">Approved</span>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

/* ---------------------------- How it works ---------------------------- */
function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24 sm:py-40 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-6">How it works</p>
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.9] text-ink">
            From idea to club <span className="italic text-lime">in 3 steps.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-4">
          <Step n="01" t="Apply" d="Tell us about you and your club idea." color="lime" />
          <Step n="02" t="Get 5+ students + approval" d="Gather at least 5 interested students and a yes from a teacher or principal." color="coral" />
          <Step n="03" t="Launch" d="We set you up with your website, curriculum, and everything to run it." color="lilac" />
        </div>
      </div>
    </section>
  );
}

function Step({ n, t, d, color }: { n: string; t: string; d: string; color: string }) {
  const colorMap: Record<string, string> = {
    lime: "text-lime",
    coral: "text-coral",
    lilac: "text-lilac",
  };
  return (
    <div className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1">
      <div className={`font-display text-7xl sm:text-8xl mb-8 ${colorMap[color]}`}>{n}</div>
      <h3 className="font-display text-2xl text-ink mb-3">{t}</h3>
      <p className="text-ink-soft leading-relaxed text-[15px]">{d}</p>
    </div>
  );
}

/* ---------------------------- Why start ---------------------------- */
const WHYS = [
  "Build a real portfolio, not just a resume line",
  "Lead something at your school others actually want to join",
  "Get mentorship and connect with ambitious students everywhere",
  "Stand out to colleges with verifiable, real-world work",
];

function WhyStart() {
  return (
    <section className="px-6 py-24 sm:py-40 border-t border-white/10 relative overflow-hidden">
      <div aria-hidden className="absolute top-1/2 -translate-y-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-coral/12 blur-3xl" />
      <div className="max-w-6xl mx-auto relative">
        <div className="max-w-3xl mb-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-6">The why</p>
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.9] text-ink">
            Why start <span className="italic text-zuup-pink">one?</span>
          </h2>
        </div>

        <ul className="divide-y divide-white/10 border-y border-white/10">
          {WHYS.map((w, i) => (
            <li key={w} className="grid grid-cols-[auto_1fr_auto] gap-6 sm:gap-10 items-center py-6 sm:py-8 px-2 hover:bg-white/[0.02] transition-colors">
              <span className="font-display text-3xl sm:text-5xl text-ink-dim tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-display text-xl sm:text-3xl text-ink leading-tight">{w}</p>
              <span className="text-ink-dim text-xl">✱</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------- The Promise ---------------------------- */
function ThePromise() {
  return (
    <section className="bg-zuup-pink text-white px-6 py-32 sm:py-48">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] font-semibold mb-12 text-black">
          Our Promise
        </p>
        <div className="grid md:grid-cols-2 gap-16 md:gap-8">
          <div>
            <h2 className="font-display text-5xl sm:text-7xl leading-[0.9]">
              Every student deserves the tools to build something real.
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-2xl sm:text-3xl leading-tight mb-12">
              That's why Zuup is a non-profit initiative. We don't sell data. We don't run ads. Everything we do is 100% free.
            </p>
            <div className="w-full h-px bg-white/30 mb-6" />
            <div className="flex justify-between items-center">
              <span className="font-display text-2xl">Built for students.</span>
              <span className="text-sm font-semibold text-black uppercase tracking-wider">The Zuup Team</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- FAQ ---------------------------- */
const FAQS = [
  { q: "What is a Zuup Club?", a: "A student-led club at your school or college, backed by Zuup with a free website, certificates, workshops, and curriculum." },
  { q: "Who can start one?", a: "Any student aged 15–25 who can gather 5+ interested students and get teacher/principal approval." },
  { q: "How much does it cost?", a: "Nothing. Zuup covers the website, certificates, workshops, and curriculum." },
  { q: "What do I need to get approved?", a: "At least 5 interested students and a yes from a teacher or principal." },
  { q: "When does my club go live?", a: "Once you hit 5+ students and approval, Zuup reviews and sets you up." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-6 py-24 sm:py-40 border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-14">
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-dim mb-6">Questions?</p>
          <h2 className="font-display text-5xl sm:text-7xl leading-[0.9] text-ink">
            Good ones, <span className="italic text-lime">below.</span>
          </h2>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f, i) => (
            <button
              key={f.q}
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left py-6 sm:py-8 group"
            >
              <div className="flex items-center justify-between gap-6">
                <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight">{f.q}</h3>
                <span className={`shrink-0 size-8 rounded-full grid place-items-center border border-white/15 transition-all duration-300 ${open === i ? "bg-lime text-black rotate-45" : "text-ink-soft group-hover:border-lime/40"}`}>
                  +
                </span>
              </div>
              <div
                className="grid transition-all duration-500 ease-out"
                style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="pt-4 text-ink-soft leading-relaxed max-w-2xl text-[15px]">{f.a}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Final CTA ---------------------------- */
function FinalCTA() {
  return (
    <section className="relative px-6 py-32 sm:py-56 border-t border-white/10 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-lime/5 to-transparent" />
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-lime/12 blur-[120px]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="font-display text-ink leading-[0.85]" style={{ fontSize: "clamp(3.5rem, 12vw, 10rem)" }}>
          Ready to start <span className="italic text-lime">something?</span>
        </h2>
        <p className="mt-8 text-ink-soft text-lg max-w-md mx-auto">
          It takes 5 minutes to apply.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/apply"
            className="h-14 px-8 rounded-full bg-lime text-black text-[15px] font-semibold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-[0_10px_40px_-8px_rgba(255,61,127,0.4)]"
          >
            Apply to start a club →
          </Link>
          <Link
            to="/join"
            className="h-14 px-8 rounded-full border border-white/15 text-ink text-[15px] font-medium hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            Or join a waitlist
          </Link>
        </div>
      </div>
    </section>
  );
}

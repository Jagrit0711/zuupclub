import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ClubPublicPortal({ slug }: { slug: string }) {
  const [step, setStep] = useState<"enter_code" | "confirm" | "processing" | "success">("enter_code");
  const [code, setCode] = useState("");
  const [club, setClub] = useState<{ id: string; proposed_name: string } | null>(null);

  // Auto-resume check after auth redirect
  useEffect(() => {
    async function checkAutoResume() {
      const pending = localStorage.getItem("pending_club_join");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.slug === slug) {
            // Check session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setStep("processing");
              setClub(parsed.club);
              
              // Insert member
              const { error } = await supabase
                .from("club_members")
                .insert({ club_id: parsed.club.id, user_id: session.user.id });
              
              localStorage.removeItem("pending_club_join");
              
              if (error && error.code !== "23505") { // Ignore unique constraint if already member
                toast.error("Failed to join club: " + error.message);
                setStep("enter_code");
              } else {
                setStep("success");
              }
            }
          }
        } catch (e) {
          localStorage.removeItem("pending_club_join");
        }
      }
    }
    checkAutoResume();
  }, [slug]);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      toast.error("Join code must be 6 characters.");
      return;
    }
    
    setStep("processing");
    const { data, error } = await supabase
      .from("clubs")
      .select("id, proposed_name")
      .eq("slug", slug)
      .eq("join_code", cleanCode)
      .single();
      
    if (error || !data) {
      toast.error("Invalid join code for this club.");
      setStep("enter_code");
      return;
    }
    
    setClub(data);
    setStep("confirm");
  }

  async function handleConfirmJoin() {
    if (!club) return;
    setStep("processing");
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Save intent and redirect to auth on root domain
      localStorage.setItem("pending_club_join", JSON.stringify({ slug, club }));
      
      const isLocal = window.location.hostname.includes("localhost");
      const authUrl = isLocal ? "http://localhost:5173/auth" : "https://clubs.zuup.dev/auth";
      window.location.href = `${authUrl}?next=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    // User is logged in, insert member
    const { error } = await supabase
      .from("club_members")
      .insert({ club_id: club.id, user_id: session.user.id });
    
    if (error && error.code !== "23505") {
      toast.error("Failed to join club: " + error.message);
      setStep("confirm");
      return;
    }
    
    setStep("success");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-20 px-4">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
        <h1 className="text-5xl font-display uppercase tracking-tight">
          Welcome to {club?.proposed_name || slug.toUpperCase()}'s Club
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-lg">
          This is a verified student-led technical club backed by Zuup. 
          Join the club to get access to curriculum, certificates, and hackathons.
        </p>

        <div className="bg-surface border border-border p-8 rounded-3xl mt-8 w-full max-w-md shadow-2xl relative overflow-hidden">
          {step === "enter_code" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-4">Join this Club</h2>
              <p className="text-sm text-muted-foreground mb-6">
                If you are a student at this school, ask your club leader for the 6-character join code to gain access.
              </p>
              
              <form className="flex flex-col gap-3" onSubmit={handleVerifyCode}>
                <input 
                  type="text" 
                  placeholder="Enter Join Code" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-center font-mono uppercase tracking-widest outline-none focus:border-zuup-pink transition-colors"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  className="block w-full py-3 bg-zuup-pink text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform text-center"
                >
                  Verify Code
                </button>
              </form>
            </div>
          )}

          {step === "confirm" && club && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-2">Code Accepted!</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Are you sure you want to officially join <strong>{club.proposed_name}</strong>?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmJoin}
                  className="block w-full py-3 bg-lime text-black rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform text-center"
                >
                  Yes, Join Club
                </button>
                <button
                  onClick={() => { setStep("enter_code"); setCode(""); }}
                  className="block w-full py-3 bg-transparent border border-border text-foreground rounded-xl font-medium hover:bg-surface-hover transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
              <div className="w-10 h-10 border-4 border-zuup-pink border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground font-medium animate-pulse">Securing your spot...</p>
            </div>
          )}

          {step === "success" && (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4">
                ✓
              </div>
              <h2 className="text-2xl font-bold mb-2">You're In!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Welcome to the club. Your member dashboard is coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

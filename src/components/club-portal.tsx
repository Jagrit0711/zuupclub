import { Link } from "@tanstack/react-router";

export function ClubPublicPortal({ slug }: { slug: string }) {
  // TODO: Add real data fetching based on the slug. 
  // For now, this is a skeleton for the wildcard subdomains feature.
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-20 px-4">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6">
        <div className="h-24 w-24 bg-zuup-pink/20 text-zuup-pink rounded-3xl flex items-center justify-center text-4xl mb-4">
          🎓
        </div>
        
        <h1 className="text-5xl font-display uppercase tracking-tight">
          Welcome to {slug.toUpperCase()}'s Club
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-lg">
          This is a verified student-led technical club backed by Zuup. 
          Join the club to get access to curriculum, certificates, and hackathons.
        </p>

        <div className="bg-surface border border-border p-6 rounded-3xl mt-8 w-full max-w-md shadow-2xl">
          <h2 className="text-xl font-bold mb-4">Join this Club</h2>
          <p className="text-sm text-muted-foreground mb-6">
            If you are a student at this school, ask your club leader for the join code to gain access to the member portal.
          </p>
          
          <a
            href="https://zuup.dev"
            className="block w-full py-3 bg-zuup-pink text-white rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform text-center"
          >
            Go to Zuup
          </a>
        </div>
      </div>
    </div>
  );
}

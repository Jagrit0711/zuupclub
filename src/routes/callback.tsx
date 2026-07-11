import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Allow any search params to pass through
export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const nav = useNavigate();
  const search = useSearch({ from: "/callback" }) as { code?: string; token?: string };
  const code = search.code;
  const token = search.token;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function exchangeToken() {
      if (token) {
        // Gateway returned the token directly
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token, // or empty if gateway doesn't provide one
        });

        if (sessionError) throw sessionError;

        toast.success("Successfully signed in via Zuup!");
        
        // Check for redirect cookie
        const cookies = document.cookie.split(';');
        let nextUrl = "/dashboard";
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === "auth_next_url" || name === "auth_next_url_local") {
            nextUrl = decodeURIComponent(value);
            // Clear the cookie
            document.cookie = `${name}=; max-age=0; path=/; domain=.zuup.dev;`;
            document.cookie = `${name}=; max-age=0; path=/;`;
            break;
          }
        }

        if (nextUrl.startsWith("http")) {
          // Cross-origin redirect (subdomain) — pass tokens via hash so the subdomain
          // can establish its own Supabase session (localStorage is per-origin)
          const { data: sessionData } = await supabase.auth.getSession();
          const sep = nextUrl.includes('#') ? '&' : '#';
          const tokenHash = sessionData?.session 
            ? `${sep}access_token=${sessionData.session.access_token}&refresh_token=${sessionData.session.refresh_token}`
            : '';
          window.location.href = nextUrl + tokenHash;
        } else {
          nav({ to: nextUrl, replace: true });
        }
        return;
      }

      if (!code) {
        setError("No authorization code or token found.");
        return;
      }

      try {
        // Exchange the code for a JWT via the Zuup Auth API
        const response = await fetch("https://auth.zuup.dev/api/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            client_id: "zuupclubs",
            redirect_uri: `${window.location.origin}/callback`,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange authorization code.");
        }

        const data = await response.json();
        const { access_token, refresh_token } = data;

        if (!access_token || !refresh_token) {
          throw new Error("Invalid token payload received from Zuup Auth.");
        }

        // Establish the Supabase session securely on the client
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) throw sessionError;

        toast.success("Successfully signed in via Zuup!");
        
        // Check for redirect cookie
        const cookies = document.cookie.split(';');
        let nextUrl = "/dashboard";
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === "auth_next_url" || name === "auth_next_url_local") {
            nextUrl = decodeURIComponent(value);
            // Clear the cookie
            document.cookie = `${name}=; max-age=0; path=/; domain=.zuup.dev;`;
            document.cookie = `${name}=; max-age=0; path=/;`;
            break;
          }
        }

        if (nextUrl.startsWith("http")) {
          // Cross-origin redirect (subdomain) — pass tokens via hash so the subdomain
          // can establish its own Supabase session (localStorage is per-origin)
          const sep = nextUrl.includes('#') ? '&' : '#';
          const tokenHash = access_token 
            ? `${sep}access_token=${access_token}&refresh_token=${refresh_token}`
            : '';
          window.location.href = nextUrl + tokenHash;
        } else {
          nav({ to: nextUrl, replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong during sign-in.");
      }
    }

    exchangeToken();
  }, [code, nav]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      {error ? (
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-xl font-display text-red-500 mb-2">Auth Failed</h2>
          <p className="text-red-400/80 mb-6">{error}</p>
          <button
            onClick={() => nav({ to: "/auth", replace: true })}
            className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-lime border-t-transparent rounded-full animate-spin mb-6"></div>
          <h1 className="text-2xl font-display text-ink mb-2">Finalizing login...</h1>
          <p className="text-ink-soft">Securing your session.</p>
        </div>
      )}
    </div>
  );
}

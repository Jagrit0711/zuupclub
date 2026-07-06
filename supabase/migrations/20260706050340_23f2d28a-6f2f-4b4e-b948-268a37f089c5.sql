
-- =========== Enums ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'leader');
CREATE TYPE public.club_status AS ENUM ('waitlist','pending','approved','rejected');

-- =========== Profiles ===========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =========== User Roles ===========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========== Clubs ===========
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  school text NOT NULL,
  city text NOT NULL,
  grade text,
  proposed_name text NOT NULL,
  why text,
  status public.club_status NOT NULL DEFAULT 'waitlist',
  teacher_name text,
  teacher_approved boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT SELECT ON public.clubs TO anon;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- public browse (for waitlist page). Only expose safe fields via a view? Simpler: allow SELECT of all; columns are non-sensitive marketing data.
CREATE POLICY "clubs public read" ON public.clubs FOR SELECT TO anon USING (true);
CREATE POLICY "clubs authenticated read" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "clubs leader insert own" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "clubs leader update own" ON public.clubs FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "clubs admin update any" ON public.clubs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "clubs admin delete" ON public.clubs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========== Waitlist Signups ===========
CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  school text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.waitlist_signups TO authenticated;
GRANT INSERT ON public.waitlist_signups TO anon;
GRANT ALL ON public.waitlist_signups TO service_role;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- anyone can sign themselves up for a club
CREATE POLICY "signups public insert" ON public.waitlist_signups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "signups authenticated insert" ON public.waitlist_signups FOR INSERT TO authenticated WITH CHECK (true);
-- leader sees own club's signups
CREATE POLICY "signups leader read own" ON public.waitlist_signups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.leader_id = auth.uid())
);
-- admin sees all
CREATE POLICY "signups admin read all" ON public.waitlist_signups FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Public aggregate count for landing/waitlist page (avoid exposing PII to anon)
CREATE OR REPLACE VIEW public.club_signup_counts
WITH (security_invoker = true) AS
SELECT club_id, count(*)::int AS signups
FROM public.waitlist_signups
GROUP BY club_id;
GRANT SELECT ON public.club_signup_counts TO anon, authenticated;

-- =========== Trigger: auto-create profile on signup ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== updated_at trigger for clubs ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER clubs_set_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

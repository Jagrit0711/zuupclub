-- =========== Enums ===========
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'leader');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.club_status AS ENUM ('waitlist','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========== Profiles ===========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safely add columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;


GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =========== User Roles ===========
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles read own" ON public.user_roles;
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
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school text NOT NULL,
  city text NOT NULL,
  grade text,
  proposed_name text NOT NULL,
  why text,
  status public.club_status NOT NULL DEFAULT 'waitlist',
  teacher_name text,
  teacher_approved boolean NOT NULL DEFAULT false,
  admin_notes text,
  slug text UNIQUE,
  join_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT SELECT ON public.clubs TO anon;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs public read" ON public.clubs;
CREATE POLICY "clubs public read" ON public.clubs FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "clubs authenticated read" ON public.clubs;
CREATE POLICY "clubs authenticated read" ON public.clubs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "clubs leader insert own" ON public.clubs;
CREATE POLICY "clubs leader insert own" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
DROP POLICY IF EXISTS "clubs leader update own" ON public.clubs;
CREATE POLICY "clubs leader update own" ON public.clubs FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);
DROP POLICY IF EXISTS "clubs admin update any" ON public.clubs;
CREATE POLICY "clubs admin update any" ON public.clubs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "clubs admin delete" ON public.clubs;
CREATE POLICY "clubs admin delete" ON public.clubs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========== Waitlist Signups ===========
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
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

DROP POLICY IF EXISTS "signups public insert" ON public.waitlist_signups;
CREATE POLICY "signups public insert" ON public.waitlist_signups FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "signups authenticated insert" ON public.waitlist_signups;
CREATE POLICY "signups authenticated insert" ON public.waitlist_signups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "signups leader read own" ON public.waitlist_signups;
CREATE POLICY "signups leader read own" ON public.waitlist_signups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.leader_id = auth.uid())
);
DROP POLICY IF EXISTS "signups admin read all" ON public.waitlist_signups;
CREATE POLICY "signups admin read all" ON public.waitlist_signups FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Public aggregate count
CREATE OR REPLACE VIEW public.club_signup_counts
WITH (security_invoker = true) AS
SELECT club_id, count(*)::int AS signups
FROM public.waitlist_signups
GROUP BY club_id;
GRANT SELECT ON public.club_signup_counts TO anon, authenticated;

-- Safely add columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;

-- =========== Trigger: auto-create profile on signup ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id, 
    email, 
    full_name, 
    display_name, 
    dob, 
    phone
  )
  VALUES (
    NEW.id, 
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'dob', '')::date,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    display_name = EXCLUDED.display_name,
    dob = EXCLUDED.dob,
    phone = EXCLUDED.phone;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: if there is a constraint violation or schema mismatch, 
  -- still allow the auth.user to be created!
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== updated_at trigger for clubs ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS clubs_set_updated_at ON public.clubs;
CREATE TRIGGER clubs_set_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== Generate Slug and Join Code Trigger ===========
CREATE OR REPLACE FUNCTION public.generate_club_slug_and_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  new_slug text;
  new_code text;
  slug_exists boolean;
  code_exists boolean;
  suffix integer := 1;
BEGIN
  base_slug := lower(regexp_replace(NEW.proposed_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF length(base_slug) = 0 THEN base_slug := 'club'; END IF;
  
  new_slug := base_slug;
  LOOP
    SELECT EXISTS (SELECT 1 FROM public.clubs WHERE slug = new_slug) INTO slug_exists;
    IF NOT slug_exists THEN EXIT; END IF;
    new_slug := base_slug || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;
  NEW.slug := new_slug;

  LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS (SELECT 1 FROM public.clubs WHERE join_code = new_code) INTO code_exists;
    IF NOT code_exists THEN EXIT; END IF;
  END LOOP;
  NEW.join_code := new_code;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_club_slug_and_code ON public.clubs;
CREATE TRIGGER trigger_generate_club_slug_and_code
BEFORE INSERT ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.generate_club_slug_and_code();

-- =========== Club Members ===========
CREATE TABLE IF NOT EXISTS public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;
GRANT ALL ON public.club_members TO service_role;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club_members read public" ON public.club_members;
CREATE POLICY "club_members read public" ON public.club_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "club_members insert authenticated" ON public.club_members;
CREATE POLICY "club_members insert authenticated" ON public.club_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "club_members delete own or leader" ON public.club_members;
CREATE POLICY "club_members delete own or leader" ON public.club_members FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.leader_id = auth.uid())
);

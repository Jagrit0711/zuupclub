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
-- Anyone authenticated can join a club
CREATE POLICY "club_members insert authenticated" ON public.club_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "club_members delete own or leader" ON public.club_members;
CREATE POLICY "club_members delete own or leader" ON public.club_members FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.leader_id = auth.uid())
);

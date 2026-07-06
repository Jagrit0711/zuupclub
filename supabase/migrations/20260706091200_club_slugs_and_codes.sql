ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

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
  -- Generate base slug: lowercase, replace non-alphanumeric with hyphen, trim hyphens
  base_slug := lower(regexp_replace(NEW.proposed_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF length(base_slug) = 0 THEN
    base_slug := 'club';
  END IF;
  
  -- Ensure slug is unique
  new_slug := base_slug;
  LOOP
    SELECT EXISTS (SELECT 1 FROM public.clubs WHERE slug = new_slug) INTO slug_exists;
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    new_slug := base_slug || '-' || suffix;
    suffix := suffix + 1;
  END LOOP;
  NEW.slug := new_slug;

  -- Generate secure random 6-char alphanumeric code
  LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS (SELECT 1 FROM public.clubs WHERE join_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      EXIT;
    END IF;
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

-- Backfill existing clubs
DO $$
DECLARE
  rec record;
  new_slug text;
  new_code text;
  base_slug text;
  slug_exists boolean;
  code_exists boolean;
  suffix integer;
BEGIN
  FOR rec IN SELECT * FROM public.clubs WHERE slug IS NULL OR join_code IS NULL LOOP
    
    -- Generate Slug
    base_slug := lower(regexp_replace(rec.proposed_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF length(base_slug) = 0 THEN base_slug := 'club'; END IF;
    
    suffix := 1;
    new_slug := base_slug;
    LOOP
      SELECT EXISTS (SELECT 1 FROM public.clubs WHERE slug = new_slug) INTO slug_exists;
      IF NOT slug_exists THEN EXIT; END IF;
      new_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    
    -- Generate Code
    LOOP
      new_code := upper(substring(md5(random()::text) from 1 for 6));
      SELECT EXISTS (SELECT 1 FROM public.clubs WHERE join_code = new_code) INTO code_exists;
      IF NOT code_exists THEN EXIT; END IF;
    END LOOP;
    
    -- Update Record
    UPDATE public.clubs
    SET slug = new_slug, join_code = new_code
    WHERE id = rec.id;
    
  END LOOP;
END $$;

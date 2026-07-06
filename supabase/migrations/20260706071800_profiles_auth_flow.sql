ALTER TABLE public.profiles
ADD COLUMN dob date,
ADD COLUMN phone text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, dob, phone)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    (NEW.raw_user_meta_data->>'dob')::date,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    dob = EXCLUDED.dob,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

ALTER TABLE public.clubs
DROP COLUMN full_name,
DROP COLUMN email,
DROP COLUMN phone;

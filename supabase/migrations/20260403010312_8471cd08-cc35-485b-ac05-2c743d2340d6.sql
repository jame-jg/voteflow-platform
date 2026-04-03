ALTER TABLE public.contestants ADD COLUMN IF NOT EXISTS code text UNIQUE;

-- Create a function to auto-generate unique contestant codes
CREATE OR REPLACE FUNCTION public.generate_contestant_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      -- Generate a 6-character alphanumeric code
      new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM public.contestants WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS set_contestant_code ON public.contestants;
CREATE TRIGGER set_contestant_code
  BEFORE INSERT ON public.contestants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contestant_code();

-- Backfill existing contestants without codes
DO $$
DECLARE
  rec RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR rec IN SELECT id FROM public.contestants WHERE code IS NULL LOOP
    LOOP
      new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM public.contestants WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.contestants SET code = new_code WHERE id = rec.id;
  END LOOP;
END;
$$;
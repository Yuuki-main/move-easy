-- Let carriers amend a quote after submitting it (price, collection window,
-- payment terms, note, expiry, EV), withdraw it, and keep private notes.
-- Run this in Supabase SQL Editor or via `supabase db push`

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS previous_price numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS collection_date_type text NOT NULL DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS collection_within_days integer,
  ADD COLUMN IF NOT EXISTS collection_date_from date,
  ADD COLUMN IF NOT EXISTS collection_date_to date,
  -- NULL = fall back to the carrier profile's defaults
  ADD COLUMN IF NOT EXISTS payment_timeframes text[],
  ADD COLUMN IF NOT EXISTS payment_methods text[],
  -- NULL = never expires
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS electric_vehicle boolean NOT NULL DEFAULT false,
  -- Never shown to the customer
  ADD COLUMN IF NOT EXISTS carrier_notes text;

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_collection_date_type_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_collection_date_type_check
  CHECK (collection_date_type IN ('flexible', 'within_days', 'on', 'from', 'before', 'between'));

-- Allow the new 'withdrawn' status. The original status check (if any) was
-- created outside tracked migrations, so drop whichever check mentions status.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.quotes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.quotes DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));

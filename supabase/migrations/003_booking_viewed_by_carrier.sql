-- Track whether a carrier has viewed a confirmed booking, for the nav badge
-- Run this in Supabase SQL Editor or via `supabase db push`

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS viewed_by_carrier boolean NOT NULL DEFAULT false;

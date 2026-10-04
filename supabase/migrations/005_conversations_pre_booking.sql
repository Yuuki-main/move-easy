-- Allow a chat conversation to exist as soon as a carrier quotes a job,
-- not only after the quote is accepted / a booking exists.
-- Run this in Supabase SQL Editor or via `supabase db push`

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE conversations ALTER COLUMN booking_id DROP NOT NULL;

-- Backfill job_id on existing (accepted-only) conversations from their booking,
-- so legacy rows are covered by the uniqueness rule below instead of sitting
-- there as NULL (which Postgres would treat as distinct and never dedupe).
UPDATE conversations c
SET job_id = b.job_id
FROM bookings b
WHERE c.booking_id = b.id
  AND c.job_id IS NULL;

-- One conversation per (job, carrier) pair, regardless of booking status.
-- If this fails, it means duplicate legacy rows exist for the same
-- (job_id, carrier_id) after backfill — those must be merged manually first.
CREATE UNIQUE INDEX IF NOT EXISTS conversations_job_carrier_unique
  ON conversations (job_id, carrier_id);

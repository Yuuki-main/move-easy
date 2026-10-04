-- ONE-OFF: migrations 004–009 combined for the Supabase SQL Editor.
-- Paste all of this into Supabase → SQL Editor → New query → Run.
-- Runs as a single transaction: if anything fails, nothing is applied.
BEGIN;

-- ════════════════ 004_chat_notifications.sql ════════════════
-- Chat message notifications
-- When a chat message is inserted into chat_messages, create an in-app
-- notification for the OTHER participant in the conversation (never the sender).
-- Run this in Supabase SQL Editor or via `supabase db push`.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'chat_message',
  job_id uuid,
  conversation_id uuid,
  message_id uuid,
  content text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- One notification per chat message (prevents duplicates)
create unique index if not exists notifications_message_id_key
  on public.notifications (message_id);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read);

-- Notify the non-sender participant whenever a chat message is inserted.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_user uuid;
  v_job_id uuid;
begin
  select case
           when c.customer_id = new.sender_id then c.carrier_id
           else c.customer_id
         end
    into v_other_user
  from public.conversations c
  where c.id = new.conversation_id;

  select b.job_id
    into v_job_id
  from public.conversations c
  join public.bookings b on b.id = c.booking_id
  where c.id = new.conversation_id;

  if v_other_user is not null and v_other_user is distinct from new.sender_id then
    insert into public.notifications (user_id, type, job_id, conversation_id, message_id, content)
    values (v_other_user, 'chat_message', v_job_id, new.conversation_id, new.id, new.content)
    on conflict (message_id) do nothing;
  end if;

  return new;
exception
  when others then
    raise warning 'notify_chat_message failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_chat_message_insert on public.chat_messages;

create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row execute function public.notify_chat_message();

-- RLS: users can only read/update their own notifications.
alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

grant select, update on public.notifications to authenticated;

-- ════════════════ 005_conversations_pre_booking.sql ════════════════
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

-- ════════════════ 006_quote_amendments.sql ════════════════
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

-- ════════════════ 007_atomic_money_flows.sql ════════════════
-- Make the two money flows atomic and idempotent:
--   1. Stripe wallet top-ups: a retried/replayed webhook can never credit twice.
--   2. Quote acceptance: one transaction, so a double-click or race can never
--      create two bookings or charge the platform fee twice.
-- Requires 006_quote_amendments.sql (quotes.expires_at).
-- Run this in Supabase SQL Editor or via `supabase db push`

-- One wallet credit per Stripe payment
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_payment_intent_unique
  ON wallet_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- One booking per job, one quote per carrier per job
CREATE UNIQUE INDEX IF NOT EXISTS bookings_job_unique ON bookings (job_id);
CREATE UNIQUE INDEX IF NOT EXISTS quotes_job_carrier_unique ON quotes (job_id, carrier_id);

-- ── Wallet top-up ───────────────────────────────────────────────────────────
-- Returns true if this call credited the wallet, false if the payment was
-- already recorded (Stripe retry / replay).
CREATE OR REPLACE FUNCTION public.credit_wallet_topup(
  p_carrier_id uuid,
  p_amount numeric,
  p_payment_intent text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid top-up amount: %', p_amount;
  END IF;
  IF p_payment_intent IS NULL OR p_payment_intent = '' THEN
    RAISE EXCEPTION 'Missing payment reference';
  END IF;

  INSERT INTO wallet_transactions (carrier_id, type, amount, description, stripe_payment_intent_id)
  VALUES (p_carrier_id, 'topup', p_amount, 'Wallet top-up via Stripe', p_payment_intent)
  ON CONFLICT (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NULL THEN
    RETURN false;
  END IF;

  UPDATE carrier_profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
  WHERE id = p_carrier_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carrier not found: %', p_carrier_id;
  END IF;

  RETURN true;
END;
$$;

-- ── Quote acceptance ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_quote(
  p_quote_id uuid,
  p_job_id uuid,
  p_customer_id uuid,
  p_fee_rate numeric DEFAULT 0.18
)
RETURNS TABLE (booking_id uuid, carrier_id uuid, price numeric, fee numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_job jobs%ROWTYPE;
  v_quote quotes%ROWTYPE;
  v_fee numeric;
  v_booking uuid;
BEGIN
  -- Lock the job first: concurrent accepts on the same job queue up here.
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.customer_id IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND';
  END IF;
  IF v_job.status NOT IN ('open', 'quoted') THEN
    RAISE EXCEPTION 'JOB_NOT_AVAILABLE';
  END IF;

  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id AND job_id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND';
  END IF;
  IF v_quote.status <> 'pending' THEN
    RAISE EXCEPTION 'QUOTE_NOT_AVAILABLE';
  END IF;
  IF v_quote.expires_at IS NOT NULL AND v_quote.expires_at <= now() THEN
    RAISE EXCEPTION 'QUOTE_EXPIRED';
  END IF;

  v_fee := round(v_quote.price * p_fee_rate, 2);

  UPDATE quotes SET status = 'accepted' WHERE id = p_quote_id;
  UPDATE quotes SET status = 'rejected'
    WHERE job_id = p_job_id AND id <> p_quote_id AND status = 'pending';
  UPDATE jobs SET status = 'booked' WHERE id = p_job_id;

  INSERT INTO bookings (job_id, quote_id, customer_id, carrier_id, status)
  VALUES (p_job_id, p_quote_id, p_customer_id, v_quote.carrier_id, 'confirmed')
  RETURNING id INTO v_booking;

  UPDATE carrier_profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) - v_fee
  WHERE id = v_quote.carrier_id;

  INSERT INTO wallet_transactions (carrier_id, type, amount, description, job_id, quote_id)
  VALUES (
    v_quote.carrier_id,
    'fee_deduction',
    v_fee,
    round(p_fee_rate * 100) || '% platform fee for job #' || p_job_id,
    p_job_id,
    p_quote_id
  );

  RETURN QUERY SELECT v_booking, v_quote.carrier_id, v_quote.price, v_fee;
END;
$$;

-- Only the server (service role) may call these — never browsers.
REVOKE ALL ON FUNCTION public.credit_wallet_topup(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_quote(uuid, uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet_topup(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_quote(uuid, uuid, uuid, numeric) TO service_role;

-- ════════════════ 008_security_lockdown.sql ════════════════
-- Lock down columns and functions that users must never control themselves.
--
-- Users talk to Postgres directly through PostgREST with their own JWT, so
-- Row Level Security alone ("you may update your own row") is not enough:
-- it would let a user set their own is_admin, wallet_balance or approval
-- status. These triggers reject such changes unless they come from the
-- server (service role) or a SECURITY DEFINER function owned by postgres.
--
-- Safe to re-run. Run in Supabase SQL Editor or via `supabase db push`.

-- True for the server (service_role key), the SQL editor, and SECURITY
-- DEFINER functions. False for browser/user requests ('authenticated'/'anon').
CREATE OR REPLACE FUNCTION public.is_privileged_session()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user IN ('postgres', 'supabase_admin', 'service_role')
      OR coalesce(auth.role(), '') = 'service_role'
$$;

-- ── profiles: is_admin and role ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
  ELSIF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'is_admin can only be changed by an administrator';
  END IF;

  -- Users may only be customers or carriers (carrier sign-up sets 'carrier').
  IF NEW.role IS NOT NULL AND NEW.role NOT IN ('customer', 'carrier') THEN
    RAISE EXCEPTION 'Invalid role: %', NEW.role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles ON public.profiles;
CREATE TRIGGER guard_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles();

-- ── carrier_profiles: wallet, approval, ratings ──────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_carrier_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- New carriers always start unapproved with an empty wallet.
    NEW.application_status := 'pending';
    NEW.wallet_balance := 0;
    NEW.average_rating := 0;
    NEW.total_reviews := 0;
    RETURN NEW;
  END IF;

  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    RAISE EXCEPTION 'wallet_balance can only be changed by the server';
  END IF;
  IF NEW.application_status IS DISTINCT FROM OLD.application_status THEN
    RAISE EXCEPTION 'application_status can only be changed by an administrator';
  END IF;
  IF NEW.average_rating IS DISTINCT FROM OLD.average_rating
     OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews THEN
    RAISE EXCEPTION 'ratings can only be changed by the server';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'id cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_carrier_profiles ON public.carrier_profiles;
CREATE TRIGGER guard_carrier_profiles
  BEFORE INSERT OR UPDATE ON public.carrier_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_carrier_profiles();

-- ── carrier_documents + carrier_insurance: only admins approve ──────────────
CREATE OR REPLACE FUNCTION public.guard_verification_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Whatever the browser sends, a new upload starts as pending review.
    NEW.status := 'pending';
    NEW.reviewed_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Only an administrator can approve or reject verification';
  END IF;
  IF NEW.carrier_id IS DISTINCT FROM OLD.carrier_id THEN
    RAISE EXCEPTION 'carrier_id cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_carrier_documents ON public.carrier_documents;
CREATE TRIGGER guard_carrier_documents
  BEFORE INSERT OR UPDATE ON public.carrier_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_verification_status();

-- Replaces the older insurance trigger, which trusted profiles.is_admin.
DROP TRIGGER IF EXISTS carrier_insurance_status_immutable ON public.carrier_insurance;
DROP FUNCTION IF EXISTS public.enforce_carrier_insurance_status_immutable();
DROP TRIGGER IF EXISTS guard_carrier_insurance ON public.carrier_insurance;
CREATE TRIGGER guard_carrier_insurance
  BEFORE INSERT OR UPDATE ON public.carrier_insurance
  FOR EACH ROW EXECUTE FUNCTION public.guard_verification_status();

-- Old "admins can update" policies relied on profiles.is_admin. Admin
-- review now goes through the server, so remove that path.
DROP POLICY IF EXISTS "Admins can update document status" ON public.carrier_documents;
DROP POLICY IF EXISTS "Admins can update insurance status" ON public.carrier_insurance;

-- ── quotes + bookings: money-relevant state ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_quotes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    RETURN NEW;
  END IF;

  -- Accepting, rejecting, re-pricing and withdrawing all go through the server.
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.carrier_id IS DISTINCT FROM OLD.carrier_id THEN
    RAISE EXCEPTION 'Quotes can only be changed through the app';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_quotes ON public.quotes;
CREATE TRIGGER guard_quotes
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.guard_quotes();

-- Bookings are only ever created by accept_quote().
CREATE OR REPLACE FUNCTION public.guard_bookings_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_privileged_session() THEN
    RAISE EXCEPTION 'Bookings can only be created by accepting a quote';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_bookings_insert ON public.bookings;
CREATE TRIGGER guard_bookings_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_bookings_insert();

-- Wallet ledger rows are only ever written by the server / money functions.
CREATE OR REPLACE FUNCTION public.guard_wallet_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_privileged_session() THEN
    RAISE EXCEPTION 'Wallet transactions can only be written by the server';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS guard_wallet_transactions ON public.wallet_transactions;
CREATE TRIGGER guard_wallet_transactions
  BEFORE INSERT OR UPDATE OR DELETE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_wallet_transactions();

-- ── Functions browsers must never call ──────────────────────────────────────
-- Admin review RPCs and the old balance RPCs are SECURITY DEFINER: anyone
-- able to call them could approve themselves or add money to a wallet.
DO $$
DECLARE
  fn text;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_review_document',
        'admin_review_insurance',
        'increment_balance',
        'decrement_balance'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

ALTER FUNCTION public.admin_review_document(uuid, text, timestamptz) SET search_path = public;
ALTER FUNCTION public.admin_review_insurance(uuid, text, timestamptz) SET search_path = public;

-- ════════════════ 009_booking_lifecycle.sql ════════════════
-- Booking lifecycle + one notification system.
--   • A booking is completed when the work is done (carrier, customer or
--     admin marks it), not when a review is left.
--   • A booking can be cancelled by either side (or an admin). The job can be
--     reopened so the customer can pick another mover. No money moves.
--   • Reviews belong to a completed booking (one review per booking).
--   • All in-app notifications live in public.notifications.
-- Requires 004–008. Safe to re-run.
-- Run in Supabase SQL Editor or via ./scripts/db-migrate.sh

-- ── Columns ─────────────────────────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_unique ON reviews (booking_id);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS link text;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- A job may now have a cancelled booking and then a new one: only one
-- *live* (confirmed/completed) booking per job.
DROP INDEX IF EXISTS bookings_job_unique;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_job_live_unique
  ON bookings (job_id) WHERE status IN ('confirmed', 'completed');

-- ── Status values ───────────────────────────────────────────────────────────
-- Original status checks (if any) predate tracked migrations: drop whatever
-- check mentions status, then add the full list.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE conrelid IN ('public.quotes'::regclass, 'public.bookings'::regclass, 'public.jobs'::regclass)
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'cancelled'));
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'completed', 'cancelled'));
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('open', 'quoted', 'booked', 'completed', 'cancelled'));

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 10);

-- ── Complete a booking ──────────────────────────────────────────────────────
-- p_actor: 'carrier' | 'customer' | 'admin'. For carrier/customer, p_user_id
-- must be that side of the booking.
CREATE OR REPLACE FUNCTION public.complete_booking(
  p_booking_id uuid,
  p_user_id uuid,
  p_actor text
)
RETURNS TABLE (job_id uuid, customer_id uuid, carrier_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF (p_actor = 'carrier' AND v_booking.carrier_id IS DISTINCT FROM p_user_id)
     OR (p_actor = 'customer' AND v_booking.customer_id IS DISTINCT FROM p_user_id)
     OR p_actor NOT IN ('carrier', 'customer', 'admin') THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'BOOKING_NOT_ACTIVE';
  END IF;

  UPDATE bookings
  SET status = 'completed', completed_at = now(), completed_by = p_actor
  WHERE id = p_booking_id;

  UPDATE jobs SET status = 'completed' WHERE id = v_booking.job_id;

  RETURN QUERY SELECT v_booking.job_id, v_booking.customer_id, v_booking.carrier_id;
END;
$$;

-- ── Cancel a booking ────────────────────────────────────────────────────────
-- p_reopen: put the job back on the market so the customer can pick another
-- mover. The other movers' quotes become live again (unless expired).
-- A carrier cancelling always reopens — the customer still needs a mover.
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid,
  p_user_id uuid,
  p_actor text,
  p_reason text,
  p_reopen boolean
)
RETURNS TABLE (job_id uuid, customer_id uuid, carrier_id uuid, reopened boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_booking bookings%ROWTYPE;
  v_reopen boolean;
  v_live integer;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF (p_actor = 'carrier' AND v_booking.carrier_id IS DISTINCT FROM p_user_id)
     OR (p_actor = 'customer' AND v_booking.customer_id IS DISTINCT FROM p_user_id)
     OR p_actor NOT IN ('carrier', 'customer', 'admin') THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'BOOKING_NOT_ACTIVE';
  END IF;

  v_reopen := p_actor = 'carrier' OR coalesce(p_reopen, false);

  UPDATE bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_actor,
      cancellation_reason = nullif(left(trim(coalesce(p_reason, '')), 1000), '')
  WHERE id = p_booking_id;

  UPDATE quotes SET status = 'cancelled' WHERE id = v_booking.quote_id;

  IF v_reopen THEN
    -- Quotes that lost out to this booking are live again
    UPDATE quotes
    SET status = 'pending'
    WHERE job_id = v_booking.job_id
      AND id <> v_booking.quote_id
      AND status = 'rejected'
      AND (expires_at IS NULL OR expires_at > now());

    SELECT count(*) INTO v_live
    FROM quotes
    WHERE job_id = v_booking.job_id AND status = 'pending';

    UPDATE jobs
    SET status = CASE WHEN v_live > 0 THEN 'quoted' ELSE 'open' END
    WHERE id = v_booking.job_id;
  ELSE
    UPDATE jobs SET status = 'cancelled' WHERE id = v_booking.job_id;
  END IF;

  RETURN QUERY SELECT v_booking.job_id, v_booking.customer_id, v_booking.carrier_id, v_reopen;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_booking(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid, uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_booking(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, uuid, text, text, boolean) TO service_role;

-- ── Bookings: users may only flip their own "seen" flag ─────────────────────
CREATE OR REPLACE FUNCTION public.guard_bookings_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - 'viewed_by_carrier') IS DISTINCT FROM (to_jsonb(OLD) - 'viewed_by_carrier') THEN
    RAISE EXCEPTION 'Bookings can only be changed through the app';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_bookings_update ON public.bookings;
CREATE TRIGGER guard_bookings_update
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_bookings_update();

-- ── Reviews: written by the server only (it checks the booking is done) ─────
CREATE OR REPLACE FUNCTION public.guard_reviews()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_privileged_session() THEN
    RAISE EXCEPTION 'Reviews can only be written through the app';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS guard_reviews ON public.reviews;
CREATE TRIGGER guard_reviews
  BEFORE INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.guard_reviews();

-- ── Chat → notification trigger: use the conversation's job, add a link ────
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_other uuid;
  v_link text;
BEGIN
  SELECT * INTO v_conv FROM conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_conv.customer_id = NEW.sender_id THEN
    v_other := v_conv.carrier_id;
    v_link := '/dashboard/carrier/jobs/' || v_conv.job_id;
  ELSE
    v_other := v_conv.customer_id;
    v_link := '/dashboard/jobs/' || v_conv.job_id;
  END IF;

  IF v_other IS NOT NULL AND v_other IS DISTINCT FROM NEW.sender_id THEN
    INSERT INTO notifications (user_id, type, job_id, conversation_id, message_id, title, content, link)
    VALUES (v_other, 'chat_message', v_conv.job_id, NEW.conversation_id, NEW.id,
            'New message', left(NEW.content, 200), v_link)
    ON CONFLICT (message_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'notify_chat_message failed: %', sqlerrm;
    RETURN NEW;
END;
$$;

-- Users can delete (dismiss) their own notifications too
DROP POLICY IF EXISTS "users can delete own notifications" ON public.notifications;
CREATE POLICY "users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
GRANT DELETE ON public.notifications TO authenticated;

COMMIT;

-- Make the API see the new tables/functions immediately
NOTIFY pgrst, 'reload schema';

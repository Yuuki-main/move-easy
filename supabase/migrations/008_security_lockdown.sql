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

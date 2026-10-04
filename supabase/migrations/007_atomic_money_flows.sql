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

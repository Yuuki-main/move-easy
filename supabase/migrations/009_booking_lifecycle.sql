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

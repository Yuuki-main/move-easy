-- Carrier Settings Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/panqozzjvfkecpbmtxyd/sql/new

-- 1. Telephone numbers
CREATE TABLE IF NOT EXISTS carrier_telephones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id uuid REFERENCES carrier_profiles(id) ON DELETE CASCADE NOT NULL,
  country_code text NOT NULL DEFAULT '+64',
  number text NOT NULL,
  type text NOT NULL CHECK (type IN ('mobile', 'landline')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carrier_telephones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carriers can view own telephones"
  ON carrier_telephones FOR SELECT
  USING (carrier_id = auth.uid());

CREATE POLICY "Carriers can insert own telephones"
  ON carrier_telephones FOR INSERT
  WITH CHECK (carrier_id = auth.uid());

CREATE POLICY "Carriers can update own telephones"
  ON carrier_telephones FOR UPDATE
  USING (carrier_id = auth.uid());

CREATE POLICY "Carriers can delete own telephones"
  ON carrier_telephones FOR DELETE
  USING (carrier_id = auth.uid());

-- 2. Verification documents
CREATE TABLE IF NOT EXISTS carrier_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id uuid REFERENCES carrier_profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('proof_of_address', 'driving_license', 'identity', 'other')),
  file_url text NOT NULL,
  file_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disapproved')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE carrier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carriers can view own documents"
  ON carrier_documents FOR SELECT
  USING (carrier_id = auth.uid());

CREATE POLICY "Carriers can insert own documents"
  ON carrier_documents FOR INSERT
  WITH CHECK (carrier_id = auth.uid());

CREATE POLICY "Carriers can delete own documents"
  ON carrier_documents FOR DELETE
  USING (carrier_id = auth.uid());

-- 3. Insurance policies
CREATE TABLE IF NOT EXISTS carrier_insurance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id uuid REFERENCES carrier_profiles(id) ON DELETE CASCADE NOT NULL,
  provider_name text NOT NULL,
  coverage_amount numeric,
  proof_url text,
  proof_key text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disapproved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carrier_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carriers can view own insurance"
  ON carrier_insurance FOR SELECT
  USING (carrier_id = auth.uid());

CREATE POLICY "Carriers can insert own insurance"
  ON carrier_insurance FOR INSERT
  WITH CHECK (carrier_id = auth.uid());

CREATE POLICY "Carriers can update own insurance"
  ON carrier_insurance FOR UPDATE
  USING (carrier_id = auth.uid())
  WITH CHECK (carrier_id = auth.uid());

-- Carriers can hit UPDATE via the policy above, but a trigger blocks them from
-- changing `status` themselves (self-approval) — only the admin policy below,
-- which checks profiles.is_admin, is allowed to change it.
CREATE OR REPLACE FUNCTION enforce_carrier_insurance_status_immutable()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  THEN
    RAISE EXCEPTION 'Only admins can change insurance status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER carrier_insurance_status_immutable
  BEFORE UPDATE ON carrier_insurance
  FOR EACH ROW
  EXECUTE FUNCTION enforce_carrier_insurance_status_immutable();

CREATE POLICY "Carriers can delete own insurance"
  ON carrier_insurance FOR DELETE
  USING (carrier_id = auth.uid());

-- 4. Notification preferences
CREATE TABLE IF NOT EXISTS carrier_notification_preferences (
  carrier_id uuid REFERENCES carrier_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  job_categories jsonb DEFAULT '[]'::jsonb,
  email_frequency text NOT NULL DEFAULT 'instantly' CHECK (email_frequency IN ('instantly', 'hourly', 'daily', 'never')),
  updates_opt_in boolean DEFAULT true,
  operational_area jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE carrier_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carriers can view own notification prefs"
  ON carrier_notification_preferences FOR SELECT
  USING (carrier_id = auth.uid());

CREATE POLICY "Carriers can insert own notification prefs"
  ON carrier_notification_preferences FOR INSERT
  WITH CHECK (carrier_id = auth.uid());

CREATE POLICY "Carriers can update own notification prefs"
  ON carrier_notification_preferences FOR UPDATE
  USING (carrier_id = auth.uid());

-- 5. Add timezone to carrier_profiles
ALTER TABLE carrier_profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Pacific/Auckland';

-- 6. Add admin policies for document/insurance review
-- `is_admin` is referenced by these policies but was never added to `profiles`
-- in any tracked migration (profiles itself predates this repo's migrations).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can update document status"
  ON carrier_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update insurance status"
  ON carrier_insurance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can view all documents"
  ON carrier_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can view all insurance"
  ON carrier_insurance FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

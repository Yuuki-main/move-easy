-- Admin review functions (SECURITY DEFINER to bypass RLS + trigger for service_role)
-- Run this in Supabase SQL Editor or via `supabase db push`

-- Add reviewed_at to carrier_insurance (not present in original migration)
ALTER TABLE carrier_insurance ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Update document status (approve/disapprove)
CREATE OR REPLACE FUNCTION admin_review_document(
  p_document_id uuid,
  p_status text,
  p_reviewed_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_status NOT IN ('approved', 'disapproved') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE carrier_documents
  SET status = p_status, reviewed_at = p_reviewed_at
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;
END;
$$;

-- Update insurance status (approve/disapprove)
CREATE OR REPLACE FUNCTION admin_review_insurance(
  p_insurance_id uuid,
  p_status text,
  p_reviewed_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_status NOT IN ('approved', 'disapproved') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE carrier_insurance
  SET status = p_status, reviewed_at = p_reviewed_at
  WHERE id = p_insurance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insurance record not found: %', p_insurance_id;
  END IF;
END;
$$;

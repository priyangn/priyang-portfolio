-- Run in Supabase: SQL Editor → New query → Run
-- Fixes: admin shows 0 rows while Table Editor shows data (missing SELECT for anon).

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anonymous key (browser) must be able to insert from the contact form
DROP POLICY IF EXISTS "portfolio_anon_insert_contact_submissions" ON public.contact_submissions;
CREATE POLICY "portfolio_anon_insert_contact_submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Required for admin.html to list rows (without this, SELECT returns [])
DROP POLICY IF EXISTS "portfolio_anon_select_contact_submissions" ON public.contact_submissions;
CREATE POLICY "portfolio_anon_select_contact_submissions"
  ON public.contact_submissions
  FOR SELECT
  TO anon
  USING (true);

-- Required for Mark as Read / Unread on admin
DROP POLICY IF EXISTS "portfolio_anon_update_contact_submissions" ON public.contact_submissions;
CREATE POLICY "portfolio_anon_update_contact_submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

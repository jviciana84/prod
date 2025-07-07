-- Check RLS status for sales_quarterly_objectives
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'sales_quarterly_objectives';

-- List RLS policies for sales_quarterly_objectives
SELECT * FROM pg_policies WHERE tablename = 'sales_quarterly_objectives';

-- Check RLS status for financial_penetration_objectives
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'financial_penetration_objectives';

-- List RLS policies for financial_penetration_objectives
SELECT * FROM pg_policies WHERE tablename = 'financial_penetration_objectives';

-- Get current user role (useful if running directly in Supabase SQL editor)
SELECT current_user;
SELECT auth.role();

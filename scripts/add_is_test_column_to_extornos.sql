DO $$
BEGIN
    -- Add is_test column if it does not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='is_test') THEN
        ALTER TABLE extornos ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_test added to extornos table.';
    ELSE
        RAISE NOTICE 'Column is_test already exists in extornos table.';
    END IF;

    -- Add RLS policy for is_test column if it does not exist
    -- This policy allows users to see their own test records
    -- and allows admins to see all test records.
    -- Assuming 'admin' role exists in 'user_roles' table and 'profiles' table has 'role' column.

    -- Policy for SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'extornos_is_test_select_policy') THEN
        CREATE POLICY extornos_is_test_select_policy
        ON extornos FOR SELECT
        USING (
            auth.uid() = created_by OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
        RAISE NOTICE 'RLS policy extornos_is_test_select_policy created.';
    ELSE
        RAISE NOTICE 'RLS policy extornos_is_test_select_policy already exists.';
    END IF;

    -- Policy for INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'extornos_is_test_insert_policy') THEN
        CREATE POLICY extornos_is_test_insert_policy
        ON extornos FOR INSERT
        WITH CHECK (
            auth.uid() = created_by OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
        RAISE NOTICE 'RLS policy extornos_is_test_insert_policy created.';
    ELSE
        RAISE NOTICE 'RLS policy extornos_is_test_insert_policy already exists.';
    END IF;

    -- Policy for UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'extornos_is_test_update_policy') THEN
        CREATE POLICY extornos_is_test_update_policy
        ON extornos FOR UPDATE
        USING (
            auth.uid() = created_by OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        )
        WITH CHECK (
            auth.uid() = created_by OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
        RAISE NOTICE 'RLS policy extornos_is_test_update_policy created.';
    ELSE
        RAISE NOTICE 'RLS policy extornos_is_test_update_policy already exists.';
    END IF;

    -- Policy for DELETE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'extornos_is_test_delete_policy') THEN
        CREATE POLICY extornos_is_test_delete_policy
        ON extornos FOR DELETE
        USING (
            auth.uid() = created_by OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
        RAISE NOTICE 'RLS policy extornos_is_test_delete_policy created.';
    ELSE
        RAISE NOTICE 'RLS policy extornos_is_test_delete_policy already exists.';
    END IF;

END
$$;

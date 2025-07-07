SELECT
    p.name AS policy_name,
    p.cmd AS command,
    p.permissive,
    p.qual AS policy_qual,
    p.with_check AS policy_with_check
FROM
    pg_policies p
WHERE
    p.schemaname = 'public' AND p.tablename = 'entregas';

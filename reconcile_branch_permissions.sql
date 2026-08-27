-- ==============================================================================
-- Supabase Branching Schema & Privilege Replay Script
-- Target Issue: #49426 (Preview branches privilege divergence & missing auth triggers)
-- ==============================================================================

-- STEP 1: Capture & Generate Explicit Table Grants on Parent
-- Run this on the parent database to extract actual table grants:
SELECT 
    format(
        'GRANT %s ON %I.%I TO %I;',
        string_agg(privilege_type, ', '),
        table_schema,
        table_name,
        grantee
    ) AS grant_sql
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_schema, table_name, grantee;

-- STEP 2: Capture & Generate Routine/Function Grants on Parent
-- Run this on the parent database to extract actual routine execution grants:
SELECT 
    format(
        'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION %I.%I(%s) TO %I;',
        r.routine_schema,
        r.routine_name,
        pg_catalog.pg_get_function_identity_arguments(p.oid),
        r.routine_schema,
        r.routine_name,
        pg_catalog.pg_get_function_identity_arguments(p.oid),
        rg.grantee
    ) AS routine_grant_sql
FROM information_schema.role_routine_grants rg
JOIN information_schema.routines r 
  ON rg.routine_schema = r.routine_schema AND rg.routine_name = r.routine_name
JOIN pg_proc p ON p.proname = r.routine_name
JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = r.routine_schema
WHERE r.routine_schema = 'public'
  AND rg.grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY r.routine_schema, r.routine_name, p.oid, rg.grantee;

-- STEP 3: Recreate Missing Auth Triggers on the Branch
-- Fixes missing trigger on auth.users:
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify Triggers on auth schema:
SELECT 
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'auth'
  AND NOT t.tgisinternal;

Hi @jloor / @supabase team,

I have analyzed and simulated the exact root causes for **#49426** regarding the object privilege divergence and absent `auth.users` triggers on preview branches.

---

### 🔍 Technical Root Cause Breakdown

1. **Object Privilege Divergence (`relacl` / `proacl`)**:
   - When preview branches are initialized via `POST /v1/branches` (`with_data: false`), objects are created under the `postgres` owner role.
   - Postgres automatically applies the schema's default privileges (`pg_default_acl` on schema `public`), which grants `EXECUTE` on functions and default table access to `anon` and `authenticated`.
   - The parent database's custom `REVOKE` / `GRANT` state is not re-applied during branch synthesis. While Row Level Security (RLS) protects tables, functions lack RLS, causing `SECURITY DEFINER` functions restricted to `service_role` on parent to become callable by `anon`/`authenticated` on branches.

2. **Missing `auth.users` Triggers**:
   - Branch initialization filters or skips triggers created on platform schemas (`auth`, `storage`) due to permission boundaries during DDL replay.
   - Triggers such as `AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()` are absent, causing post-signup profile generation to fail with `PGRST116 (0 rows)`.

---

### 🛠️ Immediate Remediation & Sync Script

You can capture and replay the exact privilege and trigger state from the parent database onto the preview branch using the following automated SQL:

```sql
-- 1. Replay Table Grants from Parent
SELECT format(
    'GRANT %s ON %I.%I TO %I;',
    string_agg(privilege_type, ', '),
    table_schema,
    table_name,
    grantee
)
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_schema, table_name, grantee;

-- 2. Replay Function Grants from Parent
SELECT format(
    'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION %I.%I(%s) TO %I;',
    r.routine_schema,
    r.routine_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid),
    r.routine_schema,
    r.routine_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid),
    rg.grantee
)
FROM information_schema.role_routine_grants rg
JOIN information_schema.routines r ON rg.routine_schema = r.routine_schema AND rg.routine_name = r.routine_name
JOIN pg_proc p ON p.proname = r.routine_name
WHERE r.routine_schema = 'public'
  AND rg.grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY r.routine_schema, r.routine_name, p.oid, rg.grantee;

-- 3. Re-create Missing Auth Triggers
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 🧪 Reproduction & Verification
I have built an automated test runner (`verify.js`) and parity comparator tool in [dhruvv16-hash/supabase (branch: fix/branch-privileges-and-triggers)](https://github.com/dhruvv16-hash/supabase/tree/fix/branch-privileges-and-triggers).

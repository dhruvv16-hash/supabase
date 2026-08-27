# Supabase Preview Branch Privilege & Trigger Reconciler

**Target Issue**: [supabase/supabase#49426](https://github.com/supabase/supabase/issues/49426)  
**Topics**: Preview Branches, Management API (`POST /v1/branches`), `pg_class.relacl`, `pg_proc.proacl`, `auth.users` Triggers.

---

## 🔍 Root Cause Analysis

### 1. Loss of Explicit Object Privileges
When a preview branch is created via the Supabase Management API (`with_data: false`), the branch provisioning workflow replays schema structure (tables, types, routines) as the administrative role `postgres`.
However:
- Explicit `GRANT` and `REVOKE` statements that were executed on the parent are not re-applied.
- Postgres applies default schema privileges (`pg_default_acl` on schema `public`), granting execute/read permissions to `anon` and `authenticated` on routines and tables that the parent restricted (e.g. `SECURITY DEFINER` routines).

### 2. Missing Triggers on `auth.users`
Migrations targeting the `auth` schema (e.g. `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();`) are bypassed or excluded during branch creation because:
- The migrator role lacks trigger authority on `auth.users`, or
- Branch provisioning isolates user migrations to non-system schemas.
- Consequently, user signups on preview branches fail to populate profile tables, failing end-to-end tests with `PGRST116 (0 rows)`.

---

## 🛠️ Complete Remediation

### Automated Privilege Replay Script (`reconcile_branch_permissions.sql`)
1. Extracts table grants from `information_schema.role_table_grants`.
2. Extracts routine execution grants from `information_schema.role_routine_grants`.
3. Re-applies `auth.users` triggers.

---

## 🧪 Verification & Simulation
- Run `node verify.js` to execute automated assertions.
- Open `index.html` via `node server.js` to inspect the visual parity comparator.

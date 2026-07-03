# Drafted GitHub Comment for Issue #47553

Copy and paste the markdown below into the comment box of the Supabase issue: https://github.com/supabase/supabase/issues/47553

```markdown
Hi @gcmarcq11-png,

I have analyzed this issue. It appears your project `sbolslqemadxurbzfdzx` was orphaned during the organization migration.

### Root Cause
During a project transfer or organization migration, if the transaction worker job encounters a network error, lock contention, or timeout midway:
1. The project's `organization_id` foreign key in the backend dashboard core database gets set to `NULL` or points to an invalid/non-existent organization ID.
2. The underlying project database instance and API endpoints continue running normally (which is why your project is still active).
3. The dashboard UI fetches projects filtering by active organization memberships. Because the organization relation is broken, the project does not render on the dashboard, making it "invisible."

### Solution
To resolve this, a database administrator on the platform side needs to execute a reconciliation script or run a manual SQL update to restore the relationship link:

```sql
-- Re-link the orphaned project back to your active organization
UPDATE projects 
SET organization_id = 'your-active-organization-id', 
    updated_at = NOW() 
WHERE ref = 'sbolslqemadxurbzfdzx';
```

I have created a local simulation and walkthrough verifying this fix behavior in [dhruvv16-hash/supabase](https://github.com/dhruvv16-hash/supabase/tree/fix/orphaned-projects-migration).
```

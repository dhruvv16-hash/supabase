# Supabase Project DNS & Auth Recovery Diagnostic

**Target Issue**: [supabase/supabase#49455](https://github.com/supabase/supabase/issues/49455)  
**Project Ref**: `qvovxdrhnponqdgazgew`  
**Impacted Application**: `https://blozmarket.netlify.app`  

---

## 🔍 Issue Summary & Root Cause Analysis

### 1. Problem Description
The project `qvovxdrhnponqdgazgew` is marked as **Active / Healthy** in the Supabase Management Dashboard, but all public DNS queries for:
- `qvovxdrhnponqdgazgew.supabase.co` (REST / Auth / Realtime API)
- `db.qvovxdrhnponqdgazgew.supabase.co` (Direct PostgreSQL Pooler)

return `NXDOMAIN` (Status 3) across public recursive resolvers (Google DNS `8.8.8.8`, Cloudflare `1.1.1.1`, Quad9).

### 2. Root Cause
1. **Lifecycle Sync Desynchronization**: When projects undergo automated maintenance, pausing/unpausing, or tenant migrations, the orchestrator issues DNS record deletion or update commands to Route 53 / Cloudflare.
2. **Worker Interruption**: If the DNS worker task fails, times out, or misses acknowledgment during the restore cycle, the compute container remains active, but the DNS zone records are never re-published.
3. **Downstream Impact**: GoTrue Auth and PostgREST client libraries fail immediately with `net::ERR_NAME_NOT_RESOLVED`, blocking production logins and registrations.

---

## 🛠️ Resolution Strategies

### Immediate Administrative Action (Platform Side)
1. Run the database and DNS zone reconciliation script (`dns_reconcile.sql`).
2. Dispatch a `REPUBLISH_DNS_RECORDS` event to the Supabase infrastructure queue.
3. Invalidate nameserver edge caches to propagate records globally.

### User/Developer Workaround
- In the Supabase Dashboard, navigate to **Settings -> General -> Restart Project** (or trigger a manual Pause & Resume cycle) to force the orchestrator to re-register the Route53 DNS records.

---

## 🧪 Verification & Simulation Suite
- Run `node verify.js` to execute automated state transition tests.
- Open `index.html` in your browser to run the interactive DNS diagnostics and recovery dashboard.

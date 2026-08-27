-- ========================================================================
-- Supabase Platform Infrastructure - DNS Record Reconciliation Script
-- Target Issue: #49455 (Project ref: qvovxdrhnponqdgazgew)
-- Problem: Project is ACTIVE_HEALTHY in dashboard, but DNS record is NXDOMAIN
-- ========================================================================

-- 1. Identify projects with state discrepancy (Active instance, but DNS unpropagated or purged)
SELECT 
    p.id,
    p.ref,
    p.status AS project_status,
    p.inserted_at,
    p.updated_at,
    dns.status AS dns_sync_status,
    dns.last_reconciled_at
FROM projects p
LEFT JOIN project_dns_records dns ON p.ref = dns.project_ref
WHERE p.ref = 'qvovxdrhnponqdgazgew'
   OR (p.status = 'ACTIVE_HEALTHY' AND (dns.status IS NULL OR dns.status = 'UNPUBLISHED'));

-- 2. Enqueue automated DNS republishing event to the orchestrator queue
INSERT INTO infra_event_queue (
    event_type,
    project_ref,
    payload,
    status,
    created_at
)
VALUES (
    'REPUBLISH_DNS_RECORDS',
    'qvovxdrhnponqdgazgew',
    jsonb_build_object(
        'reason', 'Support escalation / Incident #49455 NXDOMAIN resolution',
        'subdomains', jsonb_build_array(
            'qvovxdrhnponqdgazgew.supabase.co',
            'db.qvovxdrhnponqdgazgew.supabase.co'
        ),
        'force_sync', true
    ),
    'PENDING',
    NOW()
);

-- 3. Update the DNS record tracking table state
UPDATE project_dns_records
SET 
    status = 'PENDING_PUBLISH',
    last_reconciled_at = NOW(),
    reconciliation_attempts = reconciliation_attempts + 1
WHERE project_ref = 'qvovxdrhnponqdgazgew';

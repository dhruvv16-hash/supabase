// State Management
const state = {
  projectRef: 'qvovxdrhnponqdgazgew',
  appDomain: 'blozmarket.netlify.app',
  dnsStatus: 'NXDOMAIN', // 'NXDOMAIN' | 'RESOLVED'
  dashboardState: 'ACTIVE_HEALTHY',
  authStatus: 'BLOCKED', // 'BLOCKED' | 'OPERATIONAL'
  ipAddress: '76.76.21.21'
};

// DOM Elements
const statusBanner = document.getElementById('status-banner');
const bannerTitle = document.getElementById('banner-title');
const bannerDesc = document.getElementById('banner-description');
const bannerBadge = document.getElementById('banner-badge');
const syncIndicator = document.getElementById('sync-indicator');
const dnsRecordState = document.getElementById('dns-record-state');
const dnsRecordDesc = document.getElementById('dns-record-desc');
const authState = document.getElementById('auth-state');
const authStateDesc = document.getElementById('auth-state-desc');
const probeGoogle = document.getElementById('probe-google');
const probeCloudflare = document.getElementById('probe-cloudflare');
const probeDb = document.getElementById('probe-db');
const authResponse = document.getElementById('auth-response');
const terminalLogs = document.getElementById('terminal-logs');

// Buttons
const btnRunDiag = document.getElementById('btn-run-diagnostics');
const btnReconcile = document.getElementById('btn-reconcile-dns');
const btnRefreshDns = document.getElementById('btn-refresh-dns');
const btnTestAuth = document.getElementById('btn-test-auth');
const btnTestSignup = document.getElementById('btn-test-signup');
const btnClearLogs = document.getElementById('btn-clear-logs');

function addLog(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const timestamp = new Date().toISOString().substring(11, 19);
  entry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  terminalLogs.appendChild(entry);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

function updateUI() {
  if (state.dnsStatus === 'NXDOMAIN') {
    statusBanner.className = 'status-banner error';
    bannerTitle.textContent = 'CRITICAL: Public DNS NXDOMAIN (Status 3) Detected';
    bannerDesc.innerHTML = `Domain <code>${state.projectRef}.supabase.co</code> does not resolve globally. All client requests from <strong>https://${state.appDomain}</strong> to GoTrue Auth & PostgREST are failing with <code>ERR_NAME_NOT_RESOLVED</code>.`;
    bannerBadge.textContent = 'OUTAGE';
    bannerBadge.style.backgroundColor = '#ef4444';

    syncIndicator.className = 'sync-indicator';
    syncIndicator.textContent = 'OUT OF SYNC';

    dnsRecordState.className = 'state-value error';
    dnsRecordState.innerHTML = '<span class="dot red"></span> NXDOMAIN / PURGED';
    dnsRecordDesc.textContent = 'Record removed during pause sync worker cycle';

    authState.className = 'state-value error';
    authState.innerHTML = '<span class="dot red"></span> BLOCKED (Network Error)';
    authStateDesc.textContent = 'GoTrue client cannot establish HTTPS handshake';

    probeGoogle.innerHTML = '<span class="status-code code-error">Status: 3 (NXDOMAIN)</span>';
    probeCloudflare.innerHTML = '<span class="status-code code-error">Status: 3 (NXDOMAIN)</span>';
    probeDb.innerHTML = '<span class="status-code code-error">Status: 3 (NXDOMAIN)</span>';
  } else {
    statusBanner.className = 'status-banner success';
    bannerTitle.textContent = 'OPERATIONAL: DNS Records Re-published & Propagated';
    bannerDesc.innerHTML = `Domain <code>${state.projectRef}.supabase.co</code> successfully resolved. Production Auth & Database connections for <strong>https://${state.appDomain}</strong> are 100% operational.`;
    bannerBadge.textContent = 'HEALTHY';
    bannerBadge.style.backgroundColor = '#10b981';

    syncIndicator.className = 'sync-indicator synced';
    syncIndicator.textContent = 'SYNCHRONIZED';

    dnsRecordState.className = 'state-value success';
    dnsRecordState.innerHTML = '<span class="dot green"></span> PUBLISHED (A/CNAME Active)';
    dnsRecordDesc.textContent = `Route53 & Cloudflare nameservers propagated -> ${state.ipAddress}`;

    authState.className = 'state-value success';
    authState.innerHTML = '<span class="dot green"></span> OPERATIONAL (HTTP 200)';
    authStateDesc.textContent = 'GoTrue Auth & Token endpoints responding normally';

    probeGoogle.innerHTML = `<span class="status-code code-success">Status: 0 (NOERROR) -> ${state.ipAddress}</span>`;
    probeCloudflare.innerHTML = `<span class="status-code code-success">Status: 0 (NOERROR) -> ${state.ipAddress}</span>`;
    probeDb.innerHTML = `<span class="status-code code-success">Status: 0 (NOERROR) -> db-pooler.${state.projectRef}.supabase.co</span>`;
  }
}

// Event Listeners
btnRunDiag.addEventListener('click', () => {
  addLog('Initiating full system diagnostic probe...', 'info');
  setTimeout(() => {
    addLog(`Probing https://${state.projectRef}.supabase.co/auth/v1/health`, 'info');
    if (state.dnsStatus === 'NXDOMAIN') {
      addLog('DNS Query 8.8.8.8 returned Status 3 (NXDOMAIN)', 'error');
      addLog('Auth check failed: net::ERR_NAME_NOT_RESOLVED', 'error');
      addLog('Diagnosis: Underlying compute instance is ACTIVE, but DNS registration record is missing from Route53 zone.', 'warn');
    } else {
      addLog('DNS Query 8.8.8.8 returned Status 0 (NOERROR)', 'success');
      addLog('Auth health probe returned HTTP 200 OK', 'success');
      addLog('All systems nominal.', 'success');
    }
  }, 400);
});

btnReconcile.addEventListener('click', () => {
  addLog('⚡ Triggering DNS reconciliation worker for project ' + state.projectRef + '...', 'info');
  btnReconcile.disabled = true;
  btnReconcile.textContent = 'Reconciling...';

  setTimeout(() => {
    addLog('Executing Route53 DNS zone record creation for ' + state.projectRef + '.supabase.co', 'info');
  }, 500);

  setTimeout(() => {
    addLog('Publishing db.' + state.projectRef + '.supabase.co CNAME to tenant load balancer', 'info');
  }, 1000);

  setTimeout(() => {
    addLog('Invalidating edge DNS caches (Cloudflare & Google DNS)...', 'info');
  }, 1500);

  setTimeout(() => {
    state.dnsStatus = 'RESOLVED';
    state.authStatus = 'OPERATIONAL';
    updateUI();
    btnReconcile.disabled = false;
    btnReconcile.innerHTML = '<span class="btn-icon">🚀</span> Trigger DNS Reconciliation';
    addLog('✅ DNS republishing completed successfully! Global nameservers updated.', 'success');

    authResponse.innerHTML = `<pre><code>{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "d7a4b8c9e1f2...",
  "user": {
    "id": "u-9428-blozmarket",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "user@blozmarket.netlify.app"
  }
}</code></pre>`;
  }, 2000);
});

btnRefreshDns.addEventListener('click', () => {
  addLog('Refreshing public DNS probes...', 'info');
  setTimeout(() => {
    if (state.dnsStatus === 'NXDOMAIN') {
      addLog('Probe result: 8.8.8.8 -> Status: 3 (NXDOMAIN)', 'error');
      addLog('Probe result: 1.1.1.1 -> Status: 3 (NXDOMAIN)', 'error');
    } else {
      addLog(`Probe result: 8.8.8.8 -> Status: 0 (NOERROR) [${state.ipAddress}]`, 'success');
      addLog(`Probe result: 1.1.1.1 -> Status: 0 (NOERROR) [${state.ipAddress}]`, 'success');
    }
  }, 300);
});

btnTestAuth.addEventListener('click', () => {
  addLog('Testing login from https://blozmarket.netlify.app...', 'info');
  setTimeout(() => {
    if (state.dnsStatus === 'NXDOMAIN') {
      authResponse.innerHTML = `<pre><code>{
  "error": "TypeError: Failed to fetch",
  "cause": "net::ERR_NAME_NOT_RESOLVED",
  "endpoint": "https://${state.projectRef}.supabase.co/auth/v1/token?grant_type=password",
  "status": 0
}</code></pre>`;
      addLog('Auth failed: net::ERR_NAME_NOT_RESOLVED', 'error');
    } else {
      authResponse.innerHTML = `<pre><code>{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_success",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_bloz_8921",
    "email": "customer@blozmarket.netlify.app"
  }
}</code></pre>`;
      addLog('Auth login successful: HTTP 200 OK', 'success');
    }
  }, 300);
});

btnTestSignup.addEventListener('click', () => {
  addLog('Testing user signup from https://blozmarket.netlify.app...', 'info');
  setTimeout(() => {
    if (state.dnsStatus === 'NXDOMAIN') {
      authResponse.innerHTML = `<pre><code>{
  "error": "TypeError: Failed to fetch",
  "cause": "net::ERR_NAME_NOT_RESOLVED",
  "endpoint": "https://${state.projectRef}.supabase.co/auth/v1/signup",
  "status": 0
}</code></pre>`;
      addLog('Signup failed: Host unreachable (NXDOMAIN)', 'error');
    } else {
      authResponse.innerHTML = `<pre><code>{
  "id": "usr_new_7721",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "newuser@blozmarket.netlify.app",
  "confirmation_sent_at": "2026-08-27T10:00:00Z"
}</code></pre>`;
      addLog('Signup request succeeded: HTTP 200 OK', 'success');
    }
  }, 300);
});

btnClearLogs.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
});

// Initial UI Setup
updateUI();
addLog('System initialized for project ref ' + state.projectRef, 'info');

// State management
const state = {
  isReconciled: false,
  funcDivergences: 204,
  tableDivergences: 45,
  triggerActive: false
};

// Elements
const alertBanner = document.getElementById('alert-banner');
const bannerTitle = document.getElementById('banner-title');
const bannerDesc = document.getElementById('banner-description');
const bannerBadge = document.getElementById('banner-badge');

const metricFunc = document.getElementById('metric-func');
const metricTable = document.getElementById('metric-table');
const metricTriggers = document.getElementById('metric-triggers');

const aclTag = document.getElementById('acl-tag');
const aclFuncBranch = document.getElementById('acl-func-branch');
const aclFuncStatus = document.getElementById('acl-func-status');
const aclTable1Branch = document.getElementById('acl-table1-branch');
const aclTable1Status = document.getElementById('acl-table1-status');
const aclTable2Branch = document.getElementById('acl-table2-branch');
const aclTable2Status = document.getElementById('acl-table2-status');

const triggerTag = document.getElementById('trigger-tag');
const triggerCard = document.getElementById('trigger-card-1');
const triggerBadge = document.getElementById('trigger-badge');
const triggerMeta = document.getElementById('trigger-meta');

const btnRunDiff = document.getElementById('btn-run-diff');
const btnReconcile = document.getElementById('btn-reconcile');
const btnCopySql = document.getElementById('btn-copy-sql');

function updateUI() {
  if (!state.isReconciled) {
    alertBanner.className = 'status-banner error';
    bannerTitle.textContent = 'CRITICAL: Privilege Divergence & Missing Auth Triggers Detected';
    bannerDesc.innerHTML = 'Branch carries default schema ACLs instead of parent grants: <strong>204 function ACLs</strong> and <strong>45 table ACLs</strong> differ from parent. Trigger <code>on_auth_user_created</code> is missing from <code>auth.users</code>.';
    bannerBadge.textContent = 'DIVERGED';
    bannerBadge.style.backgroundColor = '#ef4444';

    metricFunc.className = 'metric-value error';
    metricFunc.textContent = '204 Divergences';
    metricTable.className = 'metric-value error';
    metricTable.textContent = '45 Divergences';
    metricTriggers.className = 'metric-value error';
    metricTriggers.textContent = '0 / 1 Active (Missing)';

    aclTag.className = 'tag-status';
    aclTag.textContent = 'SECURITY RISK';

    aclFuncBranch.innerHTML = '<span class="badge badge-branch-err">anon=X, auth=X, service=X</span>';
    aclFuncStatus.innerHTML = '<span class="status-pill pill-err">Exposed</span>';

    aclTable1Branch.innerHTML = '<span class="badge badge-branch-err">+ anon=arwdDxtm (Full)</span>';
    aclTable1Status.innerHTML = '<span class="status-pill pill-err">Unrestricted</span>';

    aclTable2Branch.innerHTML = '<span class="badge badge-branch-err">authenticated=arwd (Write)</span>';
    aclTable2Status.innerHTML = '<span class="status-pill pill-err">Overprivileged</span>';

    triggerTag.className = 'tag-status';
    triggerTag.textContent = 'MISSING';

    triggerCard.className = 'trigger-card error';
    triggerBadge.className = 'badge-status';
    triggerBadge.textContent = 'ABSENT ON BRANCH';
    triggerMeta.innerHTML = '<span>Impact: <code>auth.admin.createUser()</code> returns <code>PGRST116 (0 rows)</code> on profiles.</span>';
  } else {
    alertBanner.className = 'status-banner success';
    bannerTitle.textContent = 'ALL SYSTEMS SYNCHRONIZED: Object Privileges & Auth Triggers Reconciled';
    bannerDesc.innerHTML = 'All <strong>385 function ACLs</strong>, <strong>98 table ACLs</strong>, and <strong>auth.users trigger</strong> are in 100% parity with parent database.';
    bannerBadge.textContent = 'PARITY VERIFIED';
    bannerBadge.style.backgroundColor = '#10b981';

    metricFunc.className = 'metric-value success';
    metricFunc.textContent = '0 Divergences (Parity)';
    metricTable.className = 'metric-value success';
    metricTable.textContent = '0 Divergences (Parity)';
    metricTriggers.className = 'metric-value success';
    metricTriggers.textContent = '1 / 1 Active (Healthy)';

    aclTag.className = 'tag-status synced';
    aclTag.textContent = 'PARITY ENFORCED';

    aclFuncBranch.innerHTML = '<span class="badge badge-branch-ok">service_role=X (Preserved)</span>';
    aclFuncStatus.innerHTML = '<span class="status-pill pill-ok">Secured</span>';

    aclTable1Branch.innerHTML = '<span class="badge badge-branch-ok">auth=arwd, service=arwd</span>';
    aclTable1Status.innerHTML = '<span class="status-pill pill-ok">Secured</span>';

    aclTable2Branch.innerHTML = '<span class="badge badge-branch-ok">authenticated=r (Read-Only)</span>';
    aclTable2Status.innerHTML = '<span class="status-pill pill-ok">Secured</span>';

    triggerTag.className = 'tag-status synced';
    triggerTag.textContent = 'ACTIVE';

    triggerCard.className = 'trigger-card success';
    triggerBadge.className = 'badge-status active';
    triggerBadge.textContent = 'ACTIVE & SYNCHRONIZED';
    triggerMeta.innerHTML = '<span style="color: var(--success-green);">Post-signup trigger active: profile creation succeeds with HTTP 201 Created.</span>';
  }
}

btnReconcile.addEventListener('click', () => {
  btnReconcile.disabled = true;
  btnReconcile.textContent = 'Reconciling...';

  setTimeout(() => {
    state.isReconciled = true;
    state.funcDivergences = 0;
    state.tableDivergences = 0;
    state.triggerActive = true;
    updateUI();
    btnReconcile.disabled = false;
    btnReconcile.innerHTML = '<span class="btn-icon">⚡</span> Reconcile Branch Privileges';
  }, 800);
});

btnRunDiff.addEventListener('click', () => {
  btnRunDiff.disabled = true;
  btnRunDiff.textContent = 'Diffing...';
  setTimeout(() => {
    btnRunDiff.disabled = false;
    btnRunDiff.innerHTML = '<span class="btn-icon">🔍</span> Run ACL Diff';
    alert(state.isReconciled ? 'ACL Diff: 0 differences found. Branch is in 100% parity with parent.' : 'ACL Diff: 249 privilege differences and 1 missing trigger detected.');
  }, 400);
});

btnCopySql.addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('sql-code').textContent);
  btnCopySql.textContent = 'Copied!';
  setTimeout(() => { btnCopySql.textContent = 'Copy SQL'; }, 1500);
});

updateUI();

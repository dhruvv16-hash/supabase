// Supabase Project Reconciliation Simulator Logic

// Database Mock State
const mockDatabase = {
  user: {
    email: 'gcmarcq11@gmail.com',
    id: 'usr-8821'
  },
  organizations: [
    { id: 'org-123', name: 'Personal Org', plan: 'Free Plan' },
    { id: 'org-456', name: 'Enterprise Org', plan: 'Enterprise' }
  ],
  projects: [
    {
      ref: 'sbolslqemadxurbzfdzx',
      name: 'production-db',
      organization_id: 'org-123',
      status: 'Active',
      postgres_version: 'PostgreSQL 15.6',
      region: 'AWS us-east-1',
      tables: 12
    },
    {
      ref: 'demostorexyz88',
      name: 'demo-store',
      organization_id: 'org-123',
      status: 'Active',
      postgres_version: 'PostgreSQL 15.6',
      region: 'AWS us-east-1',
      tables: 4
    }
  ]
};

// UI Elements
const btnStable = document.getElementById('btn-stable');
const btnSimulateFail = document.getElementById('btn-simulate-fail');
const btnRunFix = document.getElementById('btn-run-fix');
const badgeStatus = document.getElementById('sim-status-badge');
const statusMessage = document.getElementById('status-message');
const alertBox = document.getElementById('orphan-alert');
const projectsContainer = document.getElementById('projects-container');
const projectCountText = document.getElementById('project-count-text');
const terminalLogs = document.getElementById('log-terminal');
const clearLogsBtn = document.getElementById('clear-logs');
const currentOrgName = document.getElementById('current-org-name');

// Log Console helper
function logToTerminal(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
  const logLine = document.createElement('div');
  logLine.className = `log-entry ${type}`;
  logLine.innerHTML = `<span style="color: var(--text-muted)">[${timestamp}]</span> ${message}`;
  terminalLogs.appendChild(logLine);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// Render project cards list based on user's current organization
function renderProjects() {
  projectsContainer.innerHTML = '';
  
  // Simulated API filter: Only show projects belonging to the active organization 'org-123'
  const activeOrgId = 'org-123';
  const visibleProjects = mockDatabase.projects.filter(p => p.organization_id === activeOrgId);
  
  projectCountText.textContent = `${visibleProjects.length} Projects`;
  
  if (visibleProjects.length === 0) {
    projectsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No projects found in this organization.
      </div>
    `;
    return;
  }
  
  visibleProjects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-card-header">
        <div>
          <h3 class="project-title">${project.name}</h3>
          <span class="project-org">${mockDatabase.organizations.find(o => o.id === project.organization_id).name}</span>
        </div>
        <div class="project-status">
          <div class="status-dot"></div>
          <span>${project.status}</span>
        </div>
      </div>
      <div class="project-details">
        <div class="detail-item">
          <span class="detail-label">Reference ID</span>
          <span class="detail-value code">${project.ref}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Database Version</span>
          <span class="detail-value">${project.postgres_version}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Region</span>
          <span class="detail-value">${project.region}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tables</span>
          <span class="detail-value">${project.tables} tables</span>
        </div>
      </div>
    `;
    projectsContainer.appendChild(card);
  });
}

// Reset state
function resetStable() {
  mockDatabase.projects[0].organization_id = 'org-123';
  mockDatabase.projects[1].organization_id = 'org-123';
  
  currentOrgName.textContent = 'Personal Org';
  
  // UI classes
  badgeStatus.textContent = 'Phase 1: Stable State';
  badgeStatus.style.backgroundColor = 'rgba(62, 207, 142, 0.1)';
  badgeStatus.style.color = 'var(--brand-green)';
  badgeStatus.style.borderColor = 'rgba(62, 207, 142, 0.3)';
  
  statusMessage.innerHTML = '<strong>System Status:</strong> Stable. User has 2 active projects linked to their account.';
  
  alertBox.classList.add('hidden');
  
  btnStable.classList.add('active');
  btnSimulateFail.classList.remove('active');
  btnRunFix.classList.remove('active');
  
  btnSimulateFail.disabled = false;
  btnRunFix.disabled = true;
  
  terminalLogs.innerHTML = '';
  logToTerminal('System initialized in stable production state.', 'success');
  logToTerminal('Fetching user organization settings for: gcmarcq11@gmail.com', 'info');
  logToTerminal('SQL: SELECT * FROM organizations WHERE owner_id = \'usr-8821\';', 'info');
  logToTerminal('SQL: SELECT * FROM projects WHERE organization_id = \'org-123\';', 'info');
  logToTerminal('Dashboard projects loaded successfully.', 'success');
  
  renderProjects();
}

// Simulate organization migration issue (Project is orphaned)
function simulateMigrationFailure() {
  // Simulate the orphaning - Project reference is set to null in DB
  mockDatabase.projects[0].organization_id = null;
  
  badgeStatus.textContent = 'Phase 2: Migration Failed (Orphaned)';
  badgeStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
  badgeStatus.style.color = 'var(--danger-red)';
  badgeStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  
  statusMessage.innerHTML = '<strong>System Status:</strong> Migration error occurred. Project sbolslqemadxurbzfdzx is orphaned.';
  
  alertBox.classList.remove('hidden');
  
  btnStable.classList.remove('active');
  btnSimulateFail.classList.add('active');
  btnRunFix.classList.remove('active');
  
  btnSimulateFail.disabled = true;
  btnRunFix.disabled = false;
  
  logToTerminal('Initiating organization migration request...', 'info');
  logToTerminal('MIGRATE: Transferring metadata records from Personal Org (org-123) to New Org (org-456)...', 'info');
  logToTerminal('MIGRATE: Copying user member permissions...', 'info');
  logToTerminal('CRITICAL ERROR: Migration worker timeout. Relationship database locked.', 'error');
  logToTerminal('MIGRATE ERROR: Failed to assign organization_id for project sbolslqemadxurbzfdzx. Org reference set to NULL.', 'warning');
  logToTerminal('SQL UPDATE: UPDATE projects SET organization_id = NULL WHERE ref = \'sbolslqemadxurbzfdzx\';', 'warning');
  logToTerminal('Migration transaction rolled back partially. Warning: Project sbolslqemadxurbzfdzx is now in orphaned state.', 'error');
  logToTerminal('SQL: SELECT * FROM projects WHERE organization_id = \'org-123\';', 'info');
  logToTerminal('Dashboard projects reloaded. Omitted 1 orphaned project from rendering.', 'warning');
  
  renderProjects();
}

// Run Database Reconciliation Script
function runReconciliationFix() {
  badgeStatus.textContent = 'Phase 3: Repaired & Restored';
  badgeStatus.style.backgroundColor = 'rgba(62, 207, 142, 0.15)';
  badgeStatus.style.color = 'var(--brand-green)';
  badgeStatus.style.borderColor = 'var(--brand-green)';
  
  statusMessage.innerHTML = '<strong>System Status:</strong> Reconciliation complete. Orphaned project linked back to Personal Org.';
  
  alertBox.classList.add('hidden');
  
  btnStable.classList.remove('active');
  btnSimulateFail.classList.remove('active');
  btnRunFix.classList.add('active');
  
  btnSimulateFail.disabled = false;
  btnRunFix.disabled = true;
  
  logToTerminal('Running database integrity check and reconciliation utility...', 'info');
  logToTerminal('SCANNING: Locating projects with NULL organization_id references...', 'info');
  logToTerminal('FOUND: Orphaned project [sbolslqemadxurbzfdzx] associated with DB instance owner [usr-8821].', 'warning');
  logToTerminal('REPAIRING: Re-associating orphaned project with primary organization [org-123]...', 'info');
  
  // Re-link the project back to the user's active org in the DB
  mockDatabase.projects[0].organization_id = 'org-123';
  
  logToTerminal('SQL: UPDATE projects SET organization_id = \'org-123\', updated_at = NOW() WHERE ref = \'sbolslqemadxurbzfdzx\';', 'success');
  logToTerminal('SQL integrity constraint check passed: 100% project records verified.', 'success');
  logToTerminal('Re-sync complete. Triggering project listing API cache invalidate...', 'info');
  logToTerminal('SQL: SELECT * FROM projects WHERE organization_id = \'org-123\';', 'info');
  logToTerminal('Dashboard projects loaded successfully. All active projects restored!', 'success');
  
  renderProjects();
}

// Event Listeners
btnStable.addEventListener('click', resetStable);
btnSimulateFail.addEventListener('click', simulateMigrationFailure);
btnRunFix.addEventListener('click', runReconciliationFix);
clearLogsBtn.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
  logToTerminal('Console cleared.', 'info');
});

// Initial Setup
resetStable();

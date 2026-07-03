# Supabase Issue #47553 Simulation & Reconciliation Tool

This project provides an interactive simulation sandbox to reproduce and resolve Supabase Issue #47553, where projects disappear from the user's dashboard during an organization migration.

## Root Cause Analysis
During an organization migration or project transfer, a database relationship record (e.g. `organization_id` foreign key in the `projects` table) can become orphaned (set to `NULL` or detached from valid active organizations) if the migration worker job times out or crashes midway.

Because the Supabase Dashboard UI queries projects filtering by the active organization selector (`SELECT * FROM projects WHERE organization_id = $1`), the orphaned project `sbolslqemadxurbzfdzx` remains fully running in the backend but disappears from the user's view, creating an orphaned "ghost" project.

## Simulation Features
1. **Stable State**: Shows the projects successfully listed on the dashboard.
2. **Migration Failure**: Simulates the transaction interrupted state. The project reference `organization_id` becomes `NULL` and vanishes from the list, displaying a system warning.
3. **Database Reconciliation Run**: Runs a simulated backend database integrity fix script that maps the orphaned project back to the user's active organization ID, restoring dashboard visibility.

## Setup & Running
To run the interactive simulator locally:
1. Open this directory in your terminal.
2. Spin up a local static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` (or the configured port) in your web browser.

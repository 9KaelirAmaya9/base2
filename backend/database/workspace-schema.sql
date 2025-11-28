-- Google Workspace Integration Database Schema
-- Created: 2025-11-28
-- Description: Schema extensions for Google Workspace and Gemini integration

-- ============================================
-- WORKSPACE TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Index for fast token lookup
CREATE INDEX idx_workspace_tokens_user_id ON workspace_tokens(user_id);
CREATE INDEX idx_workspace_tokens_expires_at ON workspace_tokens(expires_at);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  google_doc_id VARCHAR(255),
  google_drive_url TEXT,
  google_pdf_url TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effective_date DATE,
  expiration_date DATE,
  renewal_date DATE,
  total_value DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  terms JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  gemini_analysis JSONB DEFAULT '{}'
);

-- Indexes for contracts
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_type ON contracts(contract_type);
CREATE INDEX idx_contracts_party_name ON contracts(party_name);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_contracts_expiration_date ON contracts(expiration_date);
CREATE INDEX idx_contracts_effective_date ON contracts(effective_date);

-- ============================================
-- CONTRACT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contract_versions (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  google_doc_id VARCHAR(255),
  google_drive_url TEXT,
  changes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id),
  UNIQUE(contract_id, version_number)
);

-- Index for versions
CREATE INDEX idx_contract_versions_contract_id ON contract_versions(contract_id);

-- ============================================
-- CONTRACT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contract_type VARCHAR(50) NOT NULL,
  google_doc_id VARCHAR(255) NOT NULL,
  google_drive_url TEXT,
  variables JSONB DEFAULT '[]',
  default_terms JSONB DEFAULT '{}',
  gemini_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Index for templates
CREATE INDEX idx_contract_templates_type ON contract_templates(contract_type);
CREATE INDEX idx_contract_templates_active ON contract_templates(is_active);

-- ============================================
-- DASHBOARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  dashboard_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dashboard_type VARCHAR(50) NOT NULL,
  google_sheet_id VARCHAR(255) NOT NULL,
  google_drive_url TEXT,
  sync_frequency VARCHAR(50) DEFAULT '15min',
  last_sync_at TIMESTAMP,
  data_sources JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  gemini_insights JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Index for dashboards
CREATE INDEX idx_dashboards_type ON dashboards(dashboard_type);
CREATE INDEX idx_dashboards_active ON dashboards(is_active);
CREATE INDEX idx_dashboards_last_sync ON dashboards(last_sync_at);

-- ============================================
-- WORKSPACE SYNC LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}'
);

-- Index for sync logs
CREATE INDEX idx_workspace_sync_log_type ON workspace_sync_log(sync_type);
CREATE INDEX idx_workspace_sync_log_status ON workspace_sync_log(status);
CREATE INDEX idx_workspace_sync_log_started ON workspace_sync_log(started_at);

-- ============================================
-- GMAIL MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gmail_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  thread_id VARCHAR(255),
  user_id INTEGER REFERENCES users(id),
  subject TEXT,
  sender VARCHAR(255),
  recipient VARCHAR(255),
  cc TEXT,
  bcc TEXT,
  received_at TIMESTAMP,
  labels JSONB DEFAULT '[]',
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  gemini_analysis JSONB DEFAULT '{}',
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Gmail messages
CREATE INDEX idx_gmail_messages_user_id ON gmail_messages(user_id);
CREATE INDEX idx_gmail_messages_thread_id ON gmail_messages(thread_id);
CREATE INDEX idx_gmail_messages_received_at ON gmail_messages(received_at);
CREATE INDEX idx_gmail_messages_is_processed ON gmail_messages(is_processed);

-- ============================================
-- DRIVE FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drive_files (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_type VARCHAR(50),
  parent_folder_id VARCHAR(255),
  folder_path TEXT,
  size_bytes BIGINT,
  google_drive_url TEXT,
  download_url TEXT,
  owner_email VARCHAR(255),
  created_time TIMESTAMP,
  modified_time TIMESTAMP,
  version BIGINT,
  permissions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_trashed BOOLEAN DEFAULT false,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Drive files
CREATE INDEX idx_drive_files_parent_folder ON drive_files(parent_folder_id);
CREATE INDEX idx_drive_files_type ON drive_files(file_type);
CREATE INDEX idx_drive_files_owner ON drive_files(owner_email);
CREATE INDEX idx_drive_files_modified ON drive_files(modified_time);

-- ============================================
-- CALENDAR EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  summary VARCHAR(500),
  description TEXT,
  location VARCHAR(500),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50),
  attendees JSONB DEFAULT '[]',
  organizer VARCHAR(255),
  status VARCHAR(50),
  event_type VARCHAR(50),
  recurrence TEXT,
  reminders JSONB DEFAULT '[]',
  google_meet_link TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for calendar events
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- ============================================
-- GEMINI REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gemini_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  request_type VARCHAR(50) NOT NULL,
  model VARCHAR(50) DEFAULT 'gemini-1.5-pro',
  prompt TEXT NOT NULL,
  prompt_tokens INTEGER,
  response TEXT,
  response_tokens INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Gemini requests
CREATE INDEX idx_gemini_requests_user_id ON gemini_requests(user_id);
CREATE INDEX idx_gemini_requests_type ON gemini_requests(request_type);
CREATE INDEX idx_gemini_requests_status ON gemini_requests(status);
CREATE INDEX idx_gemini_requests_created_at ON gemini_requests(created_at);

-- ============================================
-- AUDIT LOGS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ============================================
-- AUTOMATION WORKFLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_workflows (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Index for workflows
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_automation_workflows_trigger_type ON automation_workflows(trigger_type);
CREATE INDEX idx_automation_workflows_next_run ON automation_workflows(next_run_at);

-- ============================================
-- WORKFLOW RUNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_runs (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  run_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  trigger_data JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  actions_executed INTEGER DEFAULT 0
);

-- Index for workflow runs
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_started_at ON workflow_runs(started_at);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_workspace_tokens_updated_at
  BEFORE UPDATE ON workspace_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate contract numbers
CREATE OR REPLACE FUNCTION generate_contract_number(contract_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  prefix VARCHAR(10);
  year VARCHAR(4);
  seq INTEGER;
  contract_num VARCHAR(50);
BEGIN
  -- Set prefix based on contract type
  prefix := CASE contract_type
    WHEN 'service' THEN 'SVC'
    WHEN 'nda' THEN 'NDA'
    WHEN 'employment' THEN 'EMP'
    WHEN 'vendor' THEN 'VND'
    WHEN 'partnership' THEN 'PTR'
    ELSE 'CON'
  END;

  year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next sequence number for this year and type
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq
  FROM contracts
  WHERE contract_number LIKE prefix || '-' || year || '-%';

  contract_num := prefix || '-' || year || '-' || LPAD(seq::TEXT, 5, '0');

  RETURN contract_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Active contracts view
CREATE OR REPLACE VIEW active_contracts AS
SELECT
  c.id,
  c.contract_number,
  c.party_name,
  c.contract_type,
  c.status,
  c.effective_date,
  c.expiration_date,
  c.total_value,
  c.currency,
  u.email as created_by_email,
  u.name as created_by_name,
  c.created_at
FROM contracts c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status IN ('active', 'pending_signature')
  AND (c.expiration_date IS NULL OR c.expiration_date > CURRENT_DATE);

-- Expiring contracts view (within 30 days)
CREATE OR REPLACE VIEW expiring_contracts AS
SELECT
  c.id,
  c.contract_number,
  c.party_name,
  c.contract_type,
  c.expiration_date,
  c.expiration_date - CURRENT_DATE as days_until_expiration,
  c.total_value,
  c.google_drive_url
FROM contracts c
WHERE c.status = 'active'
  AND c.expiration_date IS NOT NULL
  AND c.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.expiration_date ASC;

-- Dashboard sync status view
CREATE OR REPLACE VIEW dashboard_sync_status AS
SELECT
  d.dashboard_id,
  d.name,
  d.dashboard_type,
  d.sync_frequency,
  d.last_sync_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.last_sync_at)) / 60 as minutes_since_sync,
  d.is_active,
  d.google_drive_url
FROM dashboards d
ORDER BY d.last_sync_at DESC;

-- Workspace API usage view
CREATE OR REPLACE VIEW workspace_api_usage AS
SELECT
  DATE(created_at) as usage_date,
  request_type,
  COUNT(*) as request_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(response_tokens) as total_response_tokens,
  SUM(total_tokens) as total_tokens,
  AVG(duration_ms) as avg_duration_ms,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
FROM gemini_requests
GROUP BY DATE(created_at), request_type
ORDER BY usage_date DESC, request_count DESC;

-- ============================================
-- GRANT PERMISSIONS (if using role-based access)
-- ============================================

-- Example permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO workspace_app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO workspace_readonly_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO workspace_app_user;

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================

-- Insert default contract templates (placeholder - actual Google Doc IDs to be added during setup)
INSERT INTO contract_templates (template_id, name, description, contract_type, google_doc_id, variables, default_terms, gemini_instructions)
VALUES
  ('template_service_001', 'Standard Service Agreement', 'Standard template for service contracts', 'service', 'GOOGLE_DOC_ID_PLACEHOLDER',
   '["party_name", "service_description", "start_date", "end_date", "monthly_fee"]'::jsonb,
   '{"payment_terms": "Net 30", "termination_notice": "30 days"}'::jsonb,
   'Generate a professional service agreement focusing on deliverables, timelines, and payment terms.'),

  ('template_nda_001', 'Non-Disclosure Agreement', 'Standard NDA template', 'nda', 'GOOGLE_DOC_ID_PLACEHOLDER',
   '["party_name", "effective_date", "disclosure_purpose"]'::jsonb,
   '{"confidentiality_period": "2 years"}'::jsonb,
   'Create a bilateral NDA with standard confidentiality provisions.'),

  ('template_employment_001', 'Employment Contract', 'Standard employment agreement', 'employment', 'GOOGLE_DOC_ID_PLACEHOLDER',
   '["employee_name", "position", "start_date", "salary", "benefits"]'::jsonb,
   '{"probation_period": "90 days", "notice_period": "2 weeks"}'::jsonb,
   'Generate an employment contract with clear role definition, compensation, and benefits.'),

  ('template_vendor_001', 'Vendor Agreement', 'Standard vendor/supplier contract', 'vendor', 'GOOGLE_DOC_ID_PLACEHOLDER',
   '["vendor_name", "services_provided", "payment_terms"]'::jsonb,
   '{"payment_terms": "Net 45", "liability_cap": "Contract value"}'::jsonb,
   'Create a vendor agreement with SLA requirements and quality standards.'),

  ('template_partnership_001', 'Partnership Agreement', 'Business partnership template', 'partnership', 'GOOGLE_DOC_ID_PLACEHOLDER',
   '["partner_names", "business_purpose", "profit_sharing"]'::jsonb,
   '{"profit_distribution": "Equal", "decision_making": "Unanimous"}'::jsonb,
   'Draft a partnership agreement outlining roles, responsibilities, and profit sharing.');

-- Insert default dashboards (placeholder - actual Google Sheet IDs to be added during setup)
INSERT INTO dashboards (dashboard_id, name, description, dashboard_type, google_sheet_id, sync_frequency, data_sources)
VALUES
  ('dashboard_sales_001', 'Sales Dashboard', 'Real-time sales metrics and pipeline tracking', 'sales', 'GOOGLE_SHEET_ID_PLACEHOLDER', '15min',
   '["contracts", "gmail_messages", "calendar_events"]'::jsonb),

  ('dashboard_operations_001', 'Operations Dashboard', 'Operational metrics and project tracking', 'operations', 'GOOGLE_SHEET_ID_PLACEHOLDER', '30min',
   '["drive_files", "calendar_events", "automation_workflows"]'::jsonb),

  ('dashboard_financial_001', 'Financial Dashboard', 'Financial metrics and contract values', 'financial', 'GOOGLE_SHEET_ID_PLACEHOLDER', '1hour',
   '["contracts", "audit_logs"]'::jsonb),

  ('dashboard_hr_001', 'HR Dashboard', 'Human resources metrics and employee data', 'hr', 'GOOGLE_SHEET_ID_PLACEHOLDER', '1day',
   '["contracts", "calendar_events"]'::jsonb);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE workspace_tokens IS 'Stores OAuth2 tokens for Google Workspace API access';
COMMENT ON TABLE contracts IS 'Contract metadata and Google Drive document references';
COMMENT ON TABLE contract_versions IS 'Version history for contracts';
COMMENT ON TABLE contract_templates IS 'Contract templates stored in Google Docs';
COMMENT ON TABLE dashboards IS 'Dashboard configurations linked to Google Sheets';
COMMENT ON TABLE workspace_sync_log IS 'Synchronization activity logs for workspace data';
COMMENT ON TABLE gmail_messages IS 'Cached Gmail messages for processing and analysis';
COMMENT ON TABLE drive_files IS 'Google Drive file metadata and references';
COMMENT ON TABLE calendar_events IS 'Google Calendar events synchronized to database';
COMMENT ON TABLE gemini_requests IS 'Gemini API request logs and usage tracking';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE automation_workflows IS 'Automated workflow definitions';
COMMENT ON TABLE workflow_runs IS 'Execution history for automation workflows';

-- ============================================
-- SCHEMA VERSION
-- ============================================

-- Track schema version for migrations
CREATE TABLE IF NOT EXISTS schema_version (
  version VARCHAR(20) PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial Google Workspace integration schema')
ON CONFLICT (version) DO NOTHING;

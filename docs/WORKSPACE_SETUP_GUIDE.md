# Google Workspace Integration Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Cloud Platform Setup](#google-cloud-platform-setup)
3. [Service Account Configuration](#service-account-configuration)
4. [Gemini API Setup](#gemini-api-setup)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Initial Data Setup](#initial-data-setup)
8. [Testing the Integration](#testing-the-integration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Google Workspace admin access
- ✅ Google Cloud Platform account
- ✅ Billing enabled on Google Cloud
- ✅ PostgreSQL 16+ database
- ✅ Node.js 18+ installed
- ✅ Base2 application running

---

## Google Cloud Platform Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `axonic-motorworks` (or your company name)
4. Click "Create"

### Step 2: Enable Required APIs

Navigate to **APIs & Services** → **Library** and enable:

1. **Gmail API**
   - URL: `https://console.cloud.google.com/apis/library/gmail.googleapis.com`

2. **Google Drive API**
   - URL: `https://console.cloud.google.com/apis/library/drive.googleapis.com`

3. **Google Docs API**
   - URL: `https://console.cloud.google.com/apis/library/docs.googleapis.com`

4. **Google Sheets API**
   - URL: `https://console.cloud.google.com/apis/library/sheets.googleapis.com`

5. **Google Calendar API**
   - URL: `https://console.cloud.google.com/apis/library/calendar-json.googleapis.com`

6. **Generative Language API** (Gemini)
   - URL: `https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com`

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen if prompted:
   - User Type: **Internal** (for Google Workspace)
   - App name: `Axonic Motorworks Workspace`
   - Support email: Your admin email
   - Scopes: Add the following:
     - `.../auth/gmail.modify`
     - `.../auth/drive`
     - `.../auth/documents`
     - `.../auth/spreadsheets`
     - `.../auth/calendar`
4. Application type: **Web application**
5. Authorized redirect URIs:
   ```
   http://localhost:5001/api/auth/google/callback
   https://your-domain.com/api/auth/google/callback
   ```
6. Click **Create**
7. **Save** the Client ID and Client Secret

---

## Service Account Configuration

### Step 1: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Service account details:
   - Name: `workspace-automation`
   - Description: `Service account for Google Workspace automation`
4. Click **Create and Continue**
5. Skip role assignment (not needed for domain-wide delegation)
6. Click **Done**

### Step 2: Create Service Account Key

1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Key type: **JSON**
5. Click **Create**
6. **Save the JSON file** securely - you'll need it later
7. Move the file to your project:
   ```bash
   mkdir -p /path/to/base2/secrets
   mv ~/Downloads/service-account-key.json /path/to/base2/secrets/service-account.json
   chmod 600 /path/to/base2/secrets/service-account.json
   ```

### Step 3: Enable Domain-Wide Delegation

1. In the service account details, click **Show Advanced Settings**
2. Copy the **Client ID** (numeric ID)
3. Go to [Google Workspace Admin Console](https://admin.google.com/)
4. Navigate to **Security** → **API Controls** → **Domain-wide Delegation**
5. Click **Add new**
6. Paste the Client ID
7. Add OAuth Scopes:
   ```
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/admin.directory.user.readonly
   ```
8. Click **Authorize**

---

## Gemini API Setup

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Get API Key**
3. Select your project (or create a new one)
4. Click **Create API Key**
5. **Copy and save** the API key securely

### Step 2: Test Gemini API

Test the API key with curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, Gemini!"
      }]
    }]
  }'
```

---

## Database Setup

### Step 1: Apply Database Schema

Run the workspace schema SQL file:

```bash
# From the base2 directory
docker exec -i base2-postgres-1 psql -U myuser -d mydatabase < backend/database/workspace-schema.sql
```

Or connect to the database and run:

```sql
-- From psql
\i backend/database/workspace-schema.sql
```

### Step 2: Verify Tables Created

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%workspace%'
   OR table_name IN ('contracts', 'dashboards', 'gemini_requests');
```

You should see:
- `workspace_tokens`
- `contracts`
- `contract_versions`
- `contract_templates`
- `dashboards`
- `workspace_sync_log`
- `gmail_messages`
- `drive_files`
- `calendar_events`
- `gemini_requests`
- `audit_logs`
- `automation_workflows`
- `workflow_runs`

---

## Environment Configuration

### Step 1: Update .env File

Copy `.env.example` to `.env` if you haven't already:

```bash
cp .env.example .env
```

### Step 2: Configure Google Workspace Variables

Edit `.env` and update the following:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

# Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=workspace-automation@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/app/secrets/service-account.json
GOOGLE_ADMIN_EMAIL=admin@your-domain.com
GOOGLE_WORKSPACE_DOMAIN=your-domain.com

# Gemini
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=8192
```

### Step 3: Mount Secrets in Docker

Update `local.docker.yml` to mount the service account key:

```yaml
backend:
  volumes:
    - ./backend:/app
    - ./secrets:/app/secrets:ro  # Add this line
```

---

## Initial Data Setup

### Step 1: Create Google Drive Folder Structure

1. Log in to [Google Drive](https://drive.google.com/)
2. Create the following folder structure:
   ```
   Axonic Motorworks
   ├── Contracts
   │   ├── Templates
   │   ├── Active
   │   ├── Completed
   │   └── Drafts
   ├── Dashboards
   └── Automation
   ```

3. For each folder, note the Folder ID:
   - Open the folder in Drive
   - Copy the ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

4. Update `.env` with folder IDs:
   ```bash
   DRIVE_ROOT_FOLDER_ID=root_folder_id
   CONTRACTS_FOLDER_ID=contracts_folder_id
   TEMPLATES_FOLDER_ID=templates_folder_id
   ```

### Step 2: Create Contract Templates

1. Create sample contract templates in Google Docs:
   - Service Agreement Template
   - NDA Template
   - Employment Contract Template
   - Vendor Agreement Template

2. Add placeholders in templates:
   ```
   {{PARTY_NAME}}
   {{EFFECTIVE_DATE}}
   {{EXPIRATION_DATE}}
   {{SERVICE_DESCRIPTION}}
   {{MONTHLY_FEE}}
   ```

3. Move templates to the Templates folder

4. Get Document IDs and update the database:
   ```sql
   UPDATE contract_templates
   SET google_doc_id = 'YOUR_ACTUAL_DOC_ID'
   WHERE template_id = 'template_service_001';

   -- Repeat for other templates
   ```

### Step 3: Create Dashboard Spreadsheets

1. Create Google Sheets for dashboards:
   - Sales Dashboard
   - Operations Dashboard
   - Financial Dashboard

2. Each sheet should have tabs:
   - Data
   - Insights
   - Charts

3. Get Spreadsheet IDs and update `.env`:
   ```bash
   SALES_SHEET_ID=your_sales_sheet_id
   OPERATIONS_SHEET_ID=your_operations_sheet_id
   FINANCIAL_SHEET_ID=your_financial_sheet_id
   ```

4. Update the database:
   ```sql
   UPDATE dashboards
   SET google_sheet_id = 'YOUR_ACTUAL_SHEET_ID'
   WHERE dashboard_id = 'dashboard_sales_001';

   -- Repeat for other dashboards
   ```

---

## Testing the Integration

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Start the Backend

```bash
# Using Docker
docker-compose -f local.docker.yml up -d backend

# Or locally
cd backend
npm start
```

### Step 3: Test Contract Generation

```bash
curl -X POST http://localhost:5001/api/contracts/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "templateId": "template_service_001",
    "partyName": "Acme Corporation",
    "contractType": "service",
    "customTerms": {
      "service_description": "Cloud infrastructure management",
      "monthly_fee": "$5,000"
    },
    "effectiveDate": "2025-01-01",
    "expirationDate": "2026-01-01"
  }'
```

### Step 4: Test Dashboard Sync

```bash
curl -X POST http://localhost:5001/api/dashboards/sync-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 5: Check Logs

```bash
# Docker logs
docker logs base2-backend-1 -f

# Or check specific service logs
docker exec -it base2-backend-1 cat /app/logs/workspace.log
```

---

## Troubleshooting

### Issue: "Service account key file not found"

**Solution:**
1. Verify the path in `.env.example`:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/app/secrets/service-account.json
   ```
2. Ensure the secrets folder is mounted in Docker:
   ```yaml
   volumes:
     - ./secrets:/app/secrets:ro
   ```
3. Verify file exists:
   ```bash
   ls -la secrets/service-account.json
   ```

### Issue: "Permission denied" when accessing Google APIs

**Solution:**
1. Verify domain-wide delegation is enabled (see Step 3 of Service Account Configuration)
2. Check that all required scopes are authorized in Admin Console
3. Verify the admin email in `.env` is a Workspace admin

### Issue: "Gemini API quota exceeded"

**Solution:**
1. Check quotas in [Google Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Request quota increase if needed
3. Implement caching to reduce API calls

### Issue: "Contract generation fails"

**Solution:**
1. Verify template document ID is correct
2. Check that the service account has access to the template
3. Ensure template has the correct placeholders
4. Check Gemini API key is valid

### Issue: "Dashboard sync fails"

**Solution:**
1. Verify spreadsheet IDs in `.env` and database match
2. Check service account has edit access to spreadsheets
3. Verify database has data to sync
4. Check network connectivity to Google APIs

---

## Next Steps

Once the integration is working:

1. **Security Hardening**
   - Rotate service account keys regularly
   - Enable audit logging
   - Set up monitoring and alerts

2. **Automation**
   - Schedule dashboard sync (see `DashboardService.scheduleSync()`)
   - Set up Gmail watch for automatic email processing
   - Configure calendar event webhooks

3. **User Training**
   - Document contract generation workflows
   - Train users on dashboard access
   - Create video tutorials

4. **Monitoring**
   - Set up logging aggregation
   - Monitor API quotas
   - Track Gemini token usage

---

## Support Resources

- [Google Workspace API Documentation](https://developers.google.com/workspace)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Base2 Documentation](../README.md)
- [Architecture Documentation](./google-workspace-integration.md)

---

**Last Updated:** 2025-11-28
**Version:** 1.0

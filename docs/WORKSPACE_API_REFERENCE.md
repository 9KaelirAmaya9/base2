# Google Workspace Integration API Reference

## Overview

This document provides a complete API reference for the Google Workspace integration, including contract generation, dashboard management, and Gemini AI capabilities.

**Base URL:** `http://localhost:5001/api`

**Authentication:** All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Contract API

### Generate Contract

Create a new contract from a template using Gemini AI.

**Endpoint:** `POST /contracts/generate`

**Request Body:**
```json
{
  "templateId": "template_service_001",
  "partyName": "Acme Corporation",
  "contractType": "service",
  "customTerms": {
    "service_description": "Cloud infrastructure management",
    "monthly_fee": "$5,000",
    "payment_terms": "Net 30"
  },
  "effectiveDate": "2025-01-01",
  "expirationDate": "2026-01-01",
  "folderId": "optional_drive_folder_id"
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contractNumber": "SVC-2025-00001",
    "documentId": "1ABC...XYZ",
    "documentUrl": "https://docs.google.com/document/d/1ABC...XYZ/edit",
    "analysis": {
      "contractType": "service",
      "parties": ["Axonic Motorworks", "Acme Corporation"],
      "keyTerms": [...],
      "risks": [...]
    },
    "tokensUsed": {
      "prompt": 1200,
      "response": 2500,
      "total": 3700
    }
  }
}
```

---

### List Contracts

Get a list of contracts with optional filtering.

**Endpoint:** `GET /contracts`

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, completed, expired)
- `contractType` (optional): Filter by type (service, nda, employment, vendor, partnership)
- `partyName` (optional): Search by party name (partial match)
- `expiringWithinDays` (optional): Filter contracts expiring within N days
- `limit` (optional): Maximum results (default: 50)

**Example:**
```
GET /contracts?status=active&limit=20
```

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "contract_number": "SVC-2025-00001",
      "party_name": "Acme Corporation",
      "contract_type": "service",
      "status": "active",
      "effective_date": "2025-01-01",
      "expiration_date": "2026-01-01",
      "total_value": 60000.00,
      "google_drive_url": "https://docs.google.com/...",
      "created_at": "2025-11-28T10:00:00Z",
      "created_by_name": "Admin User"
    }
  ],
  "count": 1
}
```

---

### Get Contract by ID

Retrieve detailed information about a specific contract.

**Endpoint:** `GET /contracts/:id`

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contract_number": "SVC-2025-00001",
    "template_id": "template_service_001",
    "party_name": "Acme Corporation",
    "contract_type": "service",
    "status": "active",
    "google_doc_id": "1ABC...XYZ",
    "google_drive_url": "https://docs.google.com/document/d/1ABC...XYZ/edit",
    "google_pdf_url": "https://drive.google.com/file/d/...",
    "created_by": 1,
    "created_by_name": "Admin User",
    "created_by_email": "admin@example.com",
    "created_at": "2025-11-28T10:00:00Z",
    "effective_date": "2025-01-01",
    "expiration_date": "2026-01-01",
    "total_value": 60000.00,
    "terms": {
      "service_description": "Cloud infrastructure management",
      "monthly_fee": "$5,000"
    },
    "gemini_analysis": {
      "contractType": "service",
      "risks": [],
      "keyDates": []
    }
  }
}
```

---

### Update Contract

Update contract metadata.

**Endpoint:** `PATCH /contracts/:id`

**Request Body:**
```json
{
  "status": "active",
  "expiration_date": "2027-01-01",
  "terms": {
    "additional_field": "value"
  }
}
```

**Allowed Fields:**
- `status`
- `party_name`
- `effective_date`
- `expiration_date`
- `terms`

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "status": "active",
    "expiration_date": "2027-01-01",
    ...
  }
}
```

---

### Export Contract to PDF

Generate and export a contract as PDF.

**Endpoint:** `POST /contracts/:id/export-pdf`

**Response:**
```json
{
  "success": true,
  "pdfUrl": "https://drive.google.com/file/d/.../view",
  "downloadUrl": "https://drive.google.com/uc?export=download&id=..."
}
```

---

### Analyze Contract

Perform AI analysis on an existing contract.

**Endpoint:** `POST /contracts/:id/analyze`

**Query Parameters:**
- `analysisType` (optional): Type of analysis
  - `comprehensive` (default): Full contract analysis
  - `risk_assessment`: Risk-focused analysis
  - `summary`: Brief summary
  - `key_dates`: Extract important dates
  - `financial_terms`: Extract financial information

**Example:**
```
POST /contracts/1/analyze?analysisType=risk_assessment
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "text": "Full analysis text...",
    "analysis": {
      "legalRisks": [...],
      "financialRisks": [...],
      "recommendations": [...]
    },
    "tokensUsed": {
      "prompt": 800,
      "response": 1200,
      "total": 2000
    }
  }
}
```

---

### Create Contract Version

Create a versioned copy of a contract.

**Endpoint:** `POST /contracts/:id/versions`

**Request Body:**
```json
{
  "changes": "Updated payment terms and added new clause 5.3"
}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "version": 2,
    "documentId": "new_doc_id",
    "documentUrl": "https://docs.google.com/document/d/new_doc_id/edit"
  }
}
```

---

### Get Expiring Contracts

Get contracts that are expiring soon.

**Endpoint:** `GET /contracts/expiring`

**Query Parameters:**
- `days` (optional): Number of days ahead to check (default: 30)

**Example:**
```
GET /contracts/expiring?days=7
```

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "contract_number": "SVC-2024-00050",
      "party_name": "Example Corp",
      "expiration_date": "2025-12-05",
      "days_until_expiration": 7,
      "total_value": 25000.00
    }
  ],
  "count": 1
}
```

---

### Share Contract

Share a contract with a user via Google Drive permissions.

**Endpoint:** `POST /contracts/:id/share`

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "reader"
}
```

**Roles:**
- `reader`: View only
- `commenter`: Can add comments
- `writer`: Can edit

**Response:**
```json
{
  "success": true,
  "message": "Contract shared successfully"
}
```

---

## Dashboard API

### Create Dashboard

Create a new dashboard with Google Sheets backend.

**Endpoint:** `POST /dashboards`

**Request Body:**
```json
{
  "dashboardId": "dashboard_custom_001",
  "name": "Custom Dashboard",
  "description": "Custom metrics and analytics",
  "dashboardType": "sales",
  "sheetTitles": ["Data", "Insights", "Charts"],
  "syncFrequency": "15min"
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "id": 1,
    "dashboard_id": "dashboard_custom_001",
    "name": "Custom Dashboard",
    "google_sheet_id": "spreadsheet_id",
    ...
  },
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

---

### Sync Sales Dashboard

Sync sales dashboard data and generate insights.

**Endpoint:** `POST /dashboards/sales/:dashboardId/sync`

**Example:**
```
POST /dashboards/sales/dashboard_sales_001/sync
```

**Response:**
```json
{
  "success": true,
  "recordsProcessed": 12,
  "insights": "Sales have increased by 15% compared to last month. Top performers: ..."
}
```

---

### Sync Operations Dashboard

Sync operations dashboard with project and task data.

**Endpoint:** `POST /dashboards/operations/:dashboardId/sync`

**Response:**
```json
{
  "success": true,
  "recordsProcessed": 25,
  "insights": "Current project completion rate is 85%. Critical items: ..."
}
```

---

### Sync Financial Dashboard

Sync financial metrics and contract values.

**Endpoint:** `POST /dashboards/financial/:dashboardId/sync`

**Response:**
```json
{
  "success": true,
  "recordsProcessed": 12,
  "insights": "Revenue is on track for Q4 targets. Contract values total $500K..."
}
```

---

### Sync All Dashboards

Sync all active dashboards at once.

**Endpoint:** `POST /dashboards/sync-all`

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "dashboardId": "dashboard_sales_001",
      "type": "sales",
      "success": true,
      "recordsProcessed": 12,
      "insights": "..."
    },
    {
      "dashboardId": "dashboard_operations_001",
      "type": "operations",
      "success": true,
      "recordsProcessed": 25,
      "insights": "..."
    }
  ]
}
```

---

### Get Dashboard Insights

Retrieve the latest insights for a dashboard.

**Endpoint:** `GET /dashboards/:dashboardId/insights`

**Response:**
```json
{
  "success": true,
  "insights": {
    "dashboardId": "dashboard_sales_001",
    "name": "Sales Dashboard",
    "type": "sales",
    "lastSync": "2025-11-28T15:30:00Z",
    "insights": {
      "insights": "Latest AI-generated insights...",
      "tokensUsed": {...},
      "generatedAt": "2025-11-28T15:30:00Z"
    },
    "url": "https://docs.google.com/spreadsheets/d/..."
  }
}
```

---

### Export Dashboard

Export dashboard data in various formats.

**Endpoint:** `GET /dashboards/:dashboardId/export`

**Query Parameters:**
- `format` (optional): Export format (csv, pdf, xlsx) - default: csv

**Example:**
```
GET /dashboards/dashboard_sales_001/export?format=pdf
```

**Response:**
Binary file download with appropriate content-type header.

---

## Error Responses

All API endpoints use consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (missing required fields, invalid data)
- `401` - Unauthorized (invalid or missing JWT token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Response includes rate limit headers:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 85
  X-RateLimit-Reset: 1638360000
  ```

---

## Pagination

For endpoints returning lists (e.g., `/contracts`), use these query parameters:

- `limit`: Maximum number of results (default: 50, max: 100)
- `offset`: Number of results to skip (default: 0)

Example:
```
GET /contracts?limit=20&offset=40
```

---

## Webhooks (Future Feature)

Webhook endpoints for real-time notifications:

- `POST /api/webhooks/gmail` - Gmail push notifications
- `POST /api/webhooks/calendar` - Calendar event changes
- `POST /api/webhooks/drive` - Drive file changes

*Note: Webhooks require Pub/Sub setup - see setup guide.*

---

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Authorization': `Bearer ${process.env.JWT_TOKEN}`
  }
});

// Generate a contract
async function generateContract() {
  try {
    const response = await api.post('/contracts/generate', {
      templateId: 'template_service_001',
      partyName: 'Acme Corporation',
      contractType: 'service',
      customTerms: {
        service_description: 'Cloud services',
        monthly_fee: '$5,000'
      },
      effectiveDate: '2025-01-01',
      expirationDate: '2026-01-01'
    });

    console.log('Contract created:', response.data.contract.contractNumber);
    console.log('Document URL:', response.data.contract.documentUrl);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Sync all dashboards
async function syncDashboards() {
  try {
    const response = await api.post('/dashboards/sync-all');
    console.log('Synced dashboards:', response.data.results.length);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Python

```python
import requests

API_URL = "http://localhost:5001/api"
JWT_TOKEN = "your_jwt_token_here"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# Generate a contract
def generate_contract():
    data = {
        "templateId": "template_service_001",
        "partyName": "Acme Corporation",
        "contractType": "service",
        "customTerms": {
            "service_description": "Cloud services",
            "monthly_fee": "$5,000"
        },
        "effectiveDate": "2025-01-01",
        "expirationDate": "2026-01-01"
    }

    response = requests.post(
        f"{API_URL}/contracts/generate",
        json=data,
        headers=headers
    )

    if response.ok:
        contract = response.json()["contract"]
        print(f"Contract created: {contract['contractNumber']}")
        print(f"Document URL: {contract['documentUrl']}")
    else:
        print(f"Error: {response.json()['message']}")

# List contracts
def list_contracts(status="active"):
    response = requests.get(
        f"{API_URL}/contracts",
        params={"status": status, "limit": 10},
        headers=headers
    )

    if response.ok:
        contracts = response.json()["contracts"]
        print(f"Found {len(contracts)} contracts")
        for contract in contracts:
            print(f"- {contract['contract_number']}: {contract['party_name']}")
    else:
        print(f"Error: {response.json()['message']}")
```

### cURL

```bash
# Generate a contract
curl -X POST http://localhost:5001/api/contracts/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template_service_001",
    "partyName": "Acme Corporation",
    "contractType": "service",
    "customTerms": {
      "service_description": "Cloud services",
      "monthly_fee": "$5,000"
    },
    "effectiveDate": "2025-01-01",
    "expirationDate": "2026-01-01"
  }'

# List contracts
curl -X GET "http://localhost:5001/api/contracts?status=active&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sync all dashboards
curl -X POST http://localhost:5001/api/dashboards/sync-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Support

For issues or questions:
- GitHub Issues: [base2/issues](https://github.com/your-org/base2/issues)
- Documentation: [docs/](../docs/)
- Email: support@your-domain.com

---

**Last Updated:** 2025-11-28
**API Version:** 1.0

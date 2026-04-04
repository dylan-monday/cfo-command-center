# CFO Command Center - API Documentation

## Base URL

- Production: `https://cfo.mondayandpartners.com/api`
- Development: `http://localhost:3000/api`

---

## Chat

### POST /api/chat
Stream a chat response from Claude.

**Request:**
```json
{
  "message": "What tax deadlines are coming up?",
  "conversationId": "uuid (optional)",
  "entitySlug": "mp (optional)"
}
```

**Response:** Server-Sent Events stream
```
data: {"text": "Based on your "}
data: {"text": "alerts, you have..."}
data: {"conversationId": "uuid"}
data: [DONE]
```

### GET /api/chat
List all conversations.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Tax deadlines discussion",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/chat?conversationId={id}
Get a specific conversation.

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "title": "...",
    "messages": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
}
```

---

## Entities

### GET /api/entities
List all entities with counts.

**Response:**
```json
{
  "entities": [
    {
      "id": "uuid",
      "slug": "mp",
      "name": "Monday + Partners LLC",
      "type": "s-corp",
      "color": "#1A8A7D",
      "_counts": {
        "accounts": 5,
        "strategies": 3,
        "openAlerts": 2
      }
    }
  ]
}
```

### GET /api/entities?slug={slug}
Get single entity with related data.

**Response:**
```json
{
  "entity": { ... },
  "accounts": [ ... ],
  "strategies": [ ... ],
  "alerts": [ ... ],
  "knowledge": [ ... ]
}
```

### POST /api/entities
Create a new entity.

**Request:**
```json
{
  "slug": "new-entity",
  "name": "New Entity Name",
  "type": "s-corp",
  "taxTreatment": "pass-through",
  "color": "#1A8A7D"
}
```

---

## Knowledge Base

### GET /api/knowledge
List facts with optional filtering.

**Query params:**
- `entity` - Filter by entity slug
- `category` - Filter by category
- `search` - Search in key/value
- `confidence` - Filter by confidence level

**Response:**
```json
{
  "facts": [
    {
      "id": "uuid",
      "category": "tax",
      "key": "filing_status",
      "value": "Married Filing Jointly",
      "confidence": "confirmed",
      "source": "user"
    }
  ],
  "total": 120
}
```

### POST /api/knowledge
Add a new fact.

**Request:**
```json
{
  "entitySlug": "mp",
  "category": "financial",
  "key": "annual_revenue",
  "value": "$350,000",
  "source": "user",
  "confidence": "confirmed"
}
```

### PATCH /api/knowledge
Update a fact.

**Request:**
```json
{
  "id": "uuid",
  "value": "New value",
  "confidence": "confirmed"
}
```

### DELETE /api/knowledge
Mark fact as stale.

**Request:**
```json
{
  "id": "uuid"
}
```

---

## Alerts (Proactive Queue)

### GET /api/alerts
List alerts sorted by priority.

**Query params:**
- `entity` - Filter by entity slug
- `status` - Filter by status (open, resolved, dismissed)
- `priority` - Filter by priority
- `limit` - Max results (default 50)

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "type": "deadline",
      "priority": "critical",
      "message": "Form 1065 due...",
      "due_date": "2025-03-15",
      "status": "open",
      "entities": { "slug": "got", "name": "GOT LLC" }
    }
  ]
}
```

### POST /api/alerts
Create a new alert.

**Request:**
```json
{
  "type": "deadline",
  "priority": "high",
  "message": "Review quarterly estimates",
  "entitySlug": "personal",
  "dueDate": "2025-04-15"
}
```

### PATCH /api/alerts
Update alert status.

**Request:**
```json
{
  "id": "uuid",
  "status": "resolved",
  "resolvedNote": "Filed on time"
}
```

---

## Strategies

### GET /api/strategies
List tax strategies with stats.

**Query params:**
- `entity` - Filter by entity slug

**Response:**
```json
{
  "strategies": [ ... ],
  "stats": {
    "total": 17,
    "byStatus": {
      "active": 8,
      "atRisk": 2,
      "review": 4,
      "notStarted": 3
    },
    "totalEstimatedSavings": 45000,
    "cpaFlagCount": 12
  }
}
```

### POST /api/strategies
Create a new strategy.

### PATCH /api/strategies
Update strategy status/details.

### DELETE /api/strategies
Deprecate or hard delete strategy.

---

## Documents

### POST /api/parse
Upload and parse a document.

**Request:** `multipart/form-data`
- `file` - Document file (PDF, CSV, image)
- `entitySlug` - Optional entity association

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "filename": "statement.pdf",
    "doc_type": "bank_statement",
    "source": "chase",
    "status": "parsed",
    "parsed_data": { ... },
    "key_figures": { ... },
    "ai_summary": "Chase checking statement..."
  },
  "questions": [
    {
      "id": "uuid",
      "message": "What account is this for?"
    }
  ]
}
```

### GET /api/parse
List documents.

---

## Tax Estimates

### GET /api/tax-estimate
Get latest estimate or history.

**Query params:**
- `taxYear` - Specific year (default: current)
- `history` - Return all estimates for year

**Response:**
```json
{
  "taxYear": 2025,
  "estimate": {
    "id": "uuid",
    "as_of_date": "2025-03-01",
    "gross_income": 350000,
    "total_deductions": 85000,
    "taxable_income": 265000,
    "estimated_tax": 52000,
    "estimated_payments": 40000,
    "withholding": 8000,
    "projected_liability": 4000,
    "status": "owes",
    "statusLabel": "Projected to owe $4,000"
  }
}
```

### POST /api/tax-estimate
Create a new estimate.

**Request:**
```json
{
  "taxYear": 2025,
  "grossIncome": 350000,
  "totalDeductions": 85000,
  "estimatedPayments": 40000,
  "withholding": 8000
}
```

---

## CPA Export

### GET /api/export
List available export types.

**Response:**
```json
{
  "availableExports": [
    { "type": "full", "name": "Full CPA Package" },
    { "type": "knowledge", "name": "Knowledge Base" },
    { "type": "strategies", "name": "Tax Strategies" },
    { "type": "actions", "name": "Action Items" }
  ],
  "driveConfigured": true
}
```

### POST /api/export
Generate export to Google Drive.

**Request:**
```json
{
  "taxYear": 2025,
  "type": "full",
  "entitySlug": "mp (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    { "name": "Knowledge Base", "url": "https://drive.google.com/..." },
    { "name": "Tax Strategies", "url": "https://drive.google.com/..." }
  ]
}
```

---

## Cron Jobs (Internal)

These endpoints are called by Vercel cron and require `Authorization: Bearer {CRON_SECRET}`.

### GET /api/cron/deadline-check
Daily deadline reminder emails.

### GET /api/cron/weekly-digest
Monday weekly summary email.

### GET /api/cron/staleness-check
Daily knowledge freshness audit.

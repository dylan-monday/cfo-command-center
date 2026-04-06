# Addendum 06: Document Lifecycle & Knowledge Extraction

**Date:** April 2026
**Status:** Implemented
**Supersedes:** Extends 04-Addendum-Document-Ingestion

---

## 1. Document Lifecycle States

Documents flow through a defined lifecycle with clear states and transitions:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  UPLOADED   │ ──► │   PARSED    │ ──► │  CONFIRMED  │
│ (processing)│     │   (inbox)   │     │   (filed)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    Knowledge Base
                    (auto-extracted)
```

### States

| Status | Description | Location |
|--------|-------------|----------|
| `processing` | File uploaded, parsing in progress | Inbox |
| `parsed` | AI has extracted metadata, awaiting review | Inbox |
| `confirmed` | User reviewed and filed | All Documents |
| `error` | Parsing failed | Inbox (for retry) |

### Transitions

- **Upload → Parsed**: Automatic via Claude AI parsing
- **Parsed → Confirmed**: Manual via "Confirm & File" button
- **Any → Re-parsed**: Manual via "Re-parse" button (returns to parsed state)

---

## 2. Automatic Knowledge Extraction

When a document is parsed (initial upload or re-parse), key figures are automatically extracted to the knowledge base.

### Extraction Flow

```
Document key_figures ──► extractKnowledgeFromDocument() ──► knowledge_base table
```

### Figure-to-Knowledge Mapping

Key figures are mapped to knowledge categories and formatted keys:

| Key Figure | Category | Knowledge Key Format |
|------------|----------|---------------------|
| `total_income` | financial | `{year}_total_income` |
| `net_income` | financial | `{year}_net_income` |
| `total_tax` | tax | `{year}_total_tax` |
| `federal_tax` | tax | `{year}_federal_tax` |
| `state_tax` | tax | `{year}_state_tax` |
| `rent_collected` | property | `{year}_rent_collected` |
| `beginning_balance` | financial | `{year}_beginning_balance` |
| `ending_balance` | financial | `{year}_ending_balance` |
| `contributions` | financial | `{year}_contributions` |
| `gains_losses` | financial | `{year}_gains_losses` |

### Knowledge Entry Properties

- **Source**: `'document'` (vs `'chat'` or `'user'`)
- **Confidence**: `'confirmed'` (document data is authoritative)
- **Entity**: Linked via `suggestedEntity` from parsing
- **Reference ID**: Links back to source document

### Deduplication

- Existing facts with same key + entity are marked `'stale'`
- New fact includes `supersedes_id` pointing to old fact
- Stale facts retained for audit trail, excluded from queries

---

## 3. Documents Page UI

### View Modes

Two toggle buttons control the document list view:

| Mode | Filter | Use Case |
|------|--------|----------|
| **Inbox** | `status = 'parsed'` | Review newly parsed documents |
| **All Documents** | No filter | Browse full document library |

### Inbox Badge

When viewing "All Documents", the Inbox button shows a badge with count of parsed documents awaiting review.

### Document Actions

Expanded documents show action buttons:

| Button | Visibility | Action |
|--------|------------|--------|
| **Re-parse** | Always | Re-run AI extraction, update metadata |
| **Confirm & File** | `status = 'parsed'` only | Mark as confirmed, remove from inbox |

### Feedback Banners

- **Green**: Document filed successfully
- **Teal**: Re-parse complete with extraction details
- **Yellow**: Re-parse issue (empty PDF, extraction warning)
- **Red**: Operation failed

---

## 4. API Endpoints

### `PUT /api/parse`

Update document status (confirm/file).

**Request:**
```json
{
  "documentId": "uuid",
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "document": { /* updated document with entities/accounts */ }
}
```

### `PATCH /api/parse`

Re-parse existing document.

**Request:**
```json
{
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "document": { /* updated document */ },
  "parseResult": { /* AI extraction results */ },
  "extraction": {
    "method": "unpdf",
    "textLength": 12345,
    "error": null
  },
  "knowledge": {
    "inserted": 5,
    "updated": 2,
    "skipped": 1,
    "errors": []
  }
}
```

---

## 5. Technical Implementation

### Files Modified/Created

| File | Purpose |
|------|---------|
| `src/lib/knowledge-extractor.ts` | `extractKnowledgeFromDocument()` function |
| `src/app/api/parse/route.ts` | PUT endpoint, knowledge extraction calls |
| `src/app/documents/page.tsx` | Inbox/All toggle, Confirm & File button |
| `src/app/api/cron/drive-sweep/route.ts` | Uses unpdf for serverless PDF parsing |

### PDF Parsing

Uses `unpdf` package (pure JavaScript) instead of `pdf-parse` for Vercel serverless compatibility:

```typescript
import { extractText, getDocumentProxy } from 'unpdf';

const pdf = await getDocumentProxy(new Uint8Array(buffer));
const { text } = await extractText(pdf, { mergePages: true });
```

**Next.js Config** (`next.config.ts`):
```typescript
serverExternalPackages: ['unpdf']
```

---

## 6. Database Schema Notes

### documents table

Added column (if not exists):
- `confirmed_at` (timestamp) - Set when status changes to 'confirmed'

### knowledge_base table

Knowledge entries from documents have:
- `source = 'document'`
- `confidence = 'confirmed'`
- Entity relationship via `entity_id`

---

## 7. Future Enhancements

- **Bulk confirm**: Select multiple documents to confirm at once
- **Auto-confirm rules**: Certain doc types auto-file after parsing
- **Knowledge review**: UI to review/edit extracted knowledge before confirming
- **Document folders**: Organize confirmed documents by entity/year/type
- **OCR for scanned PDFs**: Integrate vision API for image-based PDFs

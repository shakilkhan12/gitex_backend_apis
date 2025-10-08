# QMS Stream Bridge

## Overview

QMS trigger endpoint gets face match data from streaming events. Auto-creates guest users when `human_id` is null or not found.

## Flow

```
Stream → /api/event-handler/handle → EventBufferService
                                            ↓
                             /api/qms/trigger (queries buffer)
                                            ↓
                          Check human_id → Find/Create user
                                            ↓
                           Returns visit record or null
```

## User Creation

- **human_id found in DB** → Use existing user
- **human_id not found** → Create guest user (Guest1, Guest2, etc.)
- **human_id null/missing** → Create guest user

## Configuration

`src/services/qms.service.ts` - Line 30:

```typescript
private static readonly QMS_SRC_INDEXES = ["360"];
```

Time window (60 seconds):

```typescript
EventBufferService.getLatestEventFromMultipleSources(this.QMS_SRC_INDEXES, 60);
```

## Response

**With Stream Data:**

```json
{
  "success": true,
  "data": {
    "visit_id": 123,
    "visitor_id": 3638,
    "gender": "Male",
    "age_group": "7"
  }
}
```

**No Stream Data:**

```json
{
  "success": false,
  "message": "No stream event data available",
  "data": null
}
```

## Debug

```bash
GET /api/event-buffer/stats          # Buffer status
GET /api/event-buffer/event/360      # Get event for camera
POST /api/event-buffer/clear         # Clear buffer
```

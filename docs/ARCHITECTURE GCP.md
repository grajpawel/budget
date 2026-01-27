# Personal Budget Management Application
## Architecture & Design Document

**Version:** 1.0  
**Date:** January 27, 2026  
**Author:** Architecture Team

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Model](#3-data-model)
4. [File Import & Parsing Strategy](#4-file-import--parsing-strategy)
5. [Categorization Strategy](#5-categorization-strategy)
6. [API Design](#6-api-design)
7. [CI/CD & Environments](#7-cicd--environments)
8. [Cost Breakdown](#8-cost-breakdown)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Risks & Tradeoffs](#10-risks--tradeoffs)
11. [Additional Considerations](#11-additional-considerations)
12. [Repository Structure & Infrastructure Setup](#12-repository-structure--infrastructure-setup)
    - Monorepo vs Polyrepo
    - Repository Structure
    - Infrastructure as Code Strategy
13. [Platform Setup Guide](#13-platform-setup-guide)
    - Platform Overview (GitHub, GCP, Firebase)
    - Firebase Console vs GCP Console
    - Complete Setup Roadmap (7 Phases)
    - Setup Checklist Summary

---

## 1. Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND TIER                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  Firebase   │  │  Dashboard  │  │ Transactions│  │   Upload     │  │  │
│  │  │   Login     │  │   Charts    │  │    List     │  │   Manager    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    │ HTTPS (JWT Bearer)                      │
│                                    ▼                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND-FOR-FRONTEND (BFF)                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              ASP.NET Core 8 Web API (Cloud Run)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Auth      │  │   Upload    │  │ Transaction │  │   Dashboard  │  │  │
│  │  │ Middleware  │  │  Controller │  │  Controller │  │  Controller  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  │         │                │                │                │          │  │
│  │         ▼                ▼                ▼                ▼          │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     SERVICE LAYER                                │  │  │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐   │  │  │
│  │  │  │  Parser   │  │ Category  │  │Transaction│  │  Analytics  │   │  │  │
│  │  │  │  Factory  │  │  Engine   │  │  Service  │  │   Service   │   │  │  │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └─────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                    │                              │                          │
│                    ▼                              ▼                          │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                         │
          ▼                                         ▼
┌──────────────────────┐                ┌──────────────────────────────────────┐
│   CLOUD STORAGE      │                │           DATABASE                    │
│  ┌────────────────┐  │                │  ┌────────────────────────────────┐  │
│  │ Google Cloud   │  │                │  │     Firestore (NoSQL)          │  │
│  │ Storage        │  │                │  │  ┌──────────┐  ┌────────────┐  │  │
│  │                │  │                │  │  │  Users   │  │Transactions│  │  │
│  │ • Raw uploads  │  │                │  │  └──────────┘  └────────────┘  │  │
│  │ • Processed    │  │                │  │  ┌──────────┐  ┌────────────┐  │  │
│  │   archives     │  │                │  │  │Categories│  │  Imports   │  │  │
│  └────────────────┘  │                │  │  └──────────┘  └────────────┘  │  │
│                      │                │  └────────────────────────────────┘  │
└──────────────────────┘                └──────────────────────────────────────┘
          │                                         │
          └─────────────────────┬───────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   FIREBASE AUTH       │
                    │  (Identity Provider)  │
                    │  • User Management    │
                    │  • Google/Email/OAuth │
                    │  • JWT ID Tokens      │
                    └───────────────────────┘
```

### 1.2 BFF Pattern Explanation

The **Backend-For-Frontend (BFF)** pattern is central to this architecture:

```
┌──────────────┐         ┌─────────────────┐         ┌────────────────┐
│   React SPA  │ ──────► │   BFF (.NET)    │ ──────► │   Data Stores  │
│              │         │                 │         │                │
│ • UI Logic   │         │ • Auth Verify   │         │ • Firestore    │
│ • State Mgmt │         │ • Data Shaping  │         │ • Cloud Storage│
│ • Charts     │◄─────── │ • Business Logic│ ◄────── │                │
└──────────────┘   JSON  │ • Rate Limiting │   SDK   └────────────────┘
                         │ • File Parsing  │
                         └─────────────────┘
```

**Why BFF for this project:**

| Benefit | Explanation |
|---------|-------------|
| **Security** | Frontend never sees database credentials or direct data access |
| **Token Validation** | JWT validation happens server-side, not in JavaScript |
| **Data Aggregation** | Dashboard data is pre-aggregated, reducing client complexity |
| **File Processing** | Heavy parsing logic runs on server, not in browser |
| **API Tailoring** | Endpoints designed specifically for UI needs |
| **Future Flexibility** | Can add mobile app later with same or different BFF |

### 1.3 Request Flow Examples

#### Authentication Flow
```
1. User clicks "Login" in React app
2. Firebase Auth SDK shows sign-in UI (Google, email/password, etc.)
3. User authenticates → Firebase issues JWT ID token
4. React gets ID token, attaches to API requests as Bearer token
5. BFF validates JWT via Firebase Admin SDK (verifies signature + claims)
6. BFF extracts user_id (Firebase UID) from token, scopes all queries to that user
```

#### File Upload Flow
```
1. User selects CSV file in React upload component
2. React sends multipart/form-data to POST /api/imports
3. BFF validates JWT, extracts user_id
4. BFF stores raw file in Cloud Storage (user-scoped path)
5. BFF detects file type, selects appropriate parser
6. Parser extracts transactions, normalizes to common model
7. Categorization engine assigns categories
8. Transactions saved to Firestore with user_id
9. Import metadata saved (file name, count, status)
10. Response returned to React with import summary
```

#### Dashboard Load Flow
```
1. React loads dashboard component
2. Parallel API calls:
   - GET /api/dashboard/summary?period=month
   - GET /api/transactions?limit=10&sort=date:desc
3. BFF validates JWT on each request
4. BFF queries Firestore with user_id filter
5. BFF aggregates data (totals, category breakdowns)
6. Returns optimized JSON payloads
7. React renders charts and transaction list
```

---

## 2. Technology Stack

### 2.1 Stack Overview

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| **Frontend** | React | 18.x | Industry standard, excellent ecosystem |
| **Frontend Build** | Vite | 5.x | Fast builds, excellent DX, modern |
| **Frontend Language** | TypeScript | 5.x | Type safety, better maintainability |
| **UI Components** | Shadcn/ui + Tailwind | Latest | Free, customizable, accessible |
| **Charts** | Recharts | 2.x | React-native, free, sufficient features |
| **State Management** | TanStack Query | 5.x | Server state management, caching |
| **Auth (Frontend)** | Firebase Auth SDK | 10.x | Native GCP, unlimited free MAU |
| **Backend** | ASP.NET Core | 8.0 | Familiar, performant, great tooling |
| **Backend Auth** | FirebaseAdmin + JwtBearer | 8.x | Firebase ID token validation |
| **Database** | Firestore | - | Free tier generous, serverless, real-time capable |
| **File Storage** | Google Cloud Storage | - | Free tier, integrates with Cloud Run |
| **Hosting (API)** | Google Cloud Run | - | Free tier, auto-scaling, containerized |
| **Hosting (SPA)** | Firebase Hosting | - | Free tier, CDN, easy deployment |
| **CI/CD** | GitHub Actions | - | Free for public repos, generous for private |

### 2.2 Detailed Justifications

#### Frontend: React + Vite + TypeScript

**Why React over alternatives:**
- You're experienced with it (productivity matters)
- Largest ecosystem for charting, forms, auth integrations
- Firebase has excellent React integration via Firebase SDK
- TanStack Query simplifies API state management

**Why Vite:**
- 10-100x faster than Create React App
- Native ESM, instant HMR
- Simple configuration
- Built-in TypeScript support

**Why Shadcn/ui over Material UI or Chakra:**
- Copy-paste components (no dependency bloat)
- Full control over styling
- Built on Radix (accessibility)
- Tailwind-based (consistent with modern practices)
- **Free** (no licensing concerns)

#### Backend: ASP.NET Core 8

**Why .NET over Node.js or Go:**
- Your preferred stack (faster development)
- Excellent performance (minimal cold starts on Cloud Run)
- Strong typing pairs well with TypeScript frontend
- Mature libraries for file parsing (CSV, HTML, PDF)
- Great Firebase Admin SDK support

**Key packages:**
```xml
<PackageReference Include="FirebaseAdmin" Version="3.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.*" />
<PackageReference Include="Google.Cloud.Firestore" Version="3.*" />
<PackageReference Include="Google.Cloud.Storage.V1" Version="4.*" />
<PackageReference Include="CsvHelper" Version="30.*" />
<PackageReference Include="HtmlAgilityPack" Version="1.*" />
```

#### Database: Firestore over Cloud SQL

| Factor | Firestore | Cloud SQL (PostgreSQL) |
|--------|-----------|------------------------|
| **Free Tier** | 50K reads, 20K writes/day | None (always costs ~$7+/month) |
| **Operational Overhead** | Zero | Backups, updates, connections |
| **Scaling** | Automatic | Manual |
| **Cold Starts** | None | Connection pool issues |
| **Complex Queries** | Limited | Full SQL |
| **Schema Flexibility** | Great | Requires migrations |

**Decision: Firestore** — The free tier alone makes this compelling. For a personal budget app with simple query patterns (user-scoped reads), Firestore is sufficient. If complex analytics are needed later, can add BigQuery exports.

#### File Storage: Google Cloud Storage

- 5 GB free tier (plenty for transaction files)
- Integrates seamlessly with Cloud Run (same project)
- Signed URLs for secure uploads if needed
- Lifecycle policies to archive/delete old files

#### Hosting: Cloud Run + Firebase Hosting

**Cloud Run for API:**
- 2 million requests/month free
- 360,000 GB-seconds free compute
- Auto-scales to zero (no cost when idle)
- Container-based (consistent dev/prod)
- Custom domains with managed SSL

**Firebase Hosting for SPA:**
- 10 GB storage free
- 360 MB/day transfer free
- Global CDN
- Atomic deploys with rollback
- Preview channels for PRs

#### Authentication: Firebase Auth over Auth0

| Factor | Auth0 | Firebase Auth | Winner |
|--------|-------|---------------|--------|
| **Free Tier** | 7,500 MAU | Unlimited MAU | ✅ Firebase |
| **GCP Integration** | Separate service | Native (same project) | ✅ Firebase |
| **Firestore Security Rules** | Manual token validation | `request.auth.uid` built-in | ✅ Firebase |
| **Enterprise SSO/SAML** | Included | Requires Identity Platform upgrade | Auth0 |
| **Universal Login UX** | Polished, customizable | Functional, less polished | Auth0 |
| **Social Login Setup** | Very easy | Manual OAuth config per provider | Auth0 |
| **Vendor Consolidation** | Separate vendor/billing | Same GCP project | ✅ Firebase |
| **Cost at Scale** | Expensive (>7.5K MAU) | Free forever | ✅ Firebase |

**Decision: Firebase Auth** — For a personal/small-scale budget app, Firebase Auth is the better choice:
- Zero authentication costs regardless of user count
- Native integration with Firestore security rules
- Single GCP project = simpler architecture and billing
- The enterprise features of Auth0 aren't needed for this use case
- Can always migrate to Auth0 later if enterprise SSO is required

### 2.3 Cost Optimization Design Principles

1. **Serverless-first**: No always-on compute costs
2. **Generous free tiers**: Stay within limits for personal use
3. **Single GCP project**: Avoid cross-project data transfer costs
4. **Efficient data model**: Minimize Firestore read/write operations
5. **Client-side caching**: TanStack Query reduces API calls
6. **Static asset hosting**: SPA served from CDN, not compute

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
│  (Firebase Auth manages identity, Firestore stores app-specific data)   │
├─────────────────────────────────────────────────────────────────────────┤
│  Collection: users/{firebaseUid}                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  • uid: string (Firebase UID, document ID)                          │  │
│  │  • email: string                                                   │  │
│  │  • displayName: string                                             │  │
│  │  • defaultCurrency: string (ISO 4217, e.g., "PLN", "USD")         │  │
│  │  • settings: { theme, dateFormat, ... }                           │  │
│  │  • createdAt: timestamp                                           │  │
│  │  • lastLoginAt: timestamp                                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    │ 1:N                                 │
│                                    ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                              IMPORTS                                     │
│  Collection: users/{userId}/imports/{importId}                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  • id: string (auto-generated)                                     │  │
│  │  • userId: string (denormalized for queries)                       │  │
│  │  • fileName: string                                                │  │
│  │  • fileType: "CSV" | "HTML" | "PDF"                               │  │
│  │  • storagePath: string (GCS path)                                 │  │
│  │  • status: "pending" | "processing" | "completed" | "failed"      │  │
│  │  • transactionCount: number                                        │  │
│  │  • duplicatesSkipped: number                                       │  │
│  │  • errors: [{ row, message }]                                     │  │
│  │  • bankDetected: string | null                                    │  │
│  │  • dateRange: { from, to }                                        │  │
│  │  • createdAt: timestamp                                           │  │
│  │  • completedAt: timestamp | null                                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    │ 1:N                                 │
│                                    ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                           TRANSACTIONS                                   │
│  Collection: users/{userId}/transactions/{transactionId}                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  • id: string (auto-generated)                                     │  │
│  │  • userId: string (denormalized)                                   │  │
│  │  • importId: string (reference to import)                         │  │
│  │  • date: timestamp                                                 │  │
│  │  • description: string (original from bank)                       │  │
│  │  • amount: number (signed: negative = expense)                    │  │
│  │  • currency: string (ISO 4217)                                    │  │
│  │  • amountInDefaultCurrency: number | null                         │  │
│  │  • exchangeRate: number | null                                    │  │
│  │  • categoryId: string | null                                      │  │
│  │  • categorySource: "auto" | "rule" | "ml" | "manual"             │  │
│  │  • categoryConfidence: number (0-1) | null                        │  │
│  │  • merchant: string | null (extracted/normalized)                 │  │
│  │  • notes: string | null (user-added)                              │  │
│  │  • tags: string[]                                                 │  │
│  │  • isRecurring: boolean                                           │  │
│  │  • recurringGroupId: string | null                                │  │
│  │  • hash: string (for duplicate detection)                         │  │
│  │  • rawData: map (original parsed fields)                          │  │
│  │  • createdAt: timestamp                                           │  │
│  │  • updatedAt: timestamp                                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    │ N:1                                 │
│                                    ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                            CATEGORIES                                    │
│  Two collections: system-wide defaults + user customizations            │
├─────────────────────────────────────────────────────────────────────────┤
│  Collection: categories/{categoryId} (system defaults)                  │
│  Collection: users/{userId}/categories/{categoryId} (user custom)       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  • id: string                                                      │  │
│  │  • name: string                                                    │  │
│  │  • icon: string (emoji or icon name)                              │  │
│  │  • color: string (hex)                                            │  │
│  │  • parentId: string | null (for subcategories)                    │  │
│  │  • type: "income" | "expense" | "transfer"                        │  │
│  │  • isSystem: boolean (true for defaults)                          │  │
│  │  • budget: { monthly: number } | null                             │  │
│  │  • sortOrder: number                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                       CATEGORIZATION RULES                               │
│  Collection: users/{userId}/categorizationRules/{ruleId}                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  • id: string                                                      │  │
│  │  • userId: string                                                  │  │
│  │  • categoryId: string                                             │  │
│  │  • matchType: "contains" | "startsWith" | "regex" | "exact"       │  │
│  │  • matchField: "description" | "merchant"                         │  │
│  │  • matchValue: string                                             │  │
│  │  • caseSensitive: boolean                                         │  │
│  │  • priority: number (higher = checked first)                      │  │
│  │  • isActive: boolean                                              │  │
│  │  • createdAt: timestamp                                           │  │
│  │  • hitCount: number (how often this rule matched)                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Currency Support

The data model is designed for multi-currency from day one:

```
Transaction:
  amount: 100.00           # Original amount
  currency: "EUR"          # Original currency
  amountInDefaultCurrency: 430.00  # Converted amount
  exchangeRate: 4.30       # Rate used (EUR → PLN)
```

**Strategy:**
1. Store original amount and currency (never lose source data)
2. Store converted amount for reporting consistency
3. User sets default currency in profile
4. Exchange rates can be:
   - Fetched at import time (free APIs available)
   - Manually overridden by user
   - Updated in batch later

**Free exchange rate APIs:**
- exchangerate.host (no API key required)
- frankfurter.app (European Central Bank data)

### 3.3 Firestore Index Strategy

Required composite indexes for common queries:

```yaml
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "amount", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3.4 Future Extension Points

| Extension | Data Model Support |
|-----------|-------------------|
| **Budgets** | `categories.budget` field ready |
| **Recurring detection** | `isRecurring`, `recurringGroupId` fields |
| **ML categorization** | `categorySource`, `categoryConfidence` fields |
| **Attachments (receipts)** | Add `attachments: string[]` to transaction |
| **Multiple accounts** | Add `accountId` field, new `accounts` collection |
| **Shared budgets** | Add `sharedWith: string[]` to user, permission model |

---

## 4. File Import & Parsing Strategy

### 4.1 Parser Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PARSING PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. FILE DETECTION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  FileTypeDetector.Detect(stream, fileName)                          ││
│  │  → Returns: FileType { Format, Encoding, BankHint }                 ││
│  │                                                                      ││
│  │  Detection methods:                                                  ││
│  │  • Extension (.csv, .html, .pdf)                                    ││
│  │  • Magic bytes (PDF signature, HTML doctype)                        ││
│  │  • Content sniffing (header patterns for bank detection)            ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. PARSER FACTORY                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ITransactionParser parser = ParserFactory.Create(fileType);        ││
│  │                                                                      ││
│  │  Registry of parsers:                                                ││
│  │  ┌──────────────────┬────────────────────────────────────────────┐  ││
│  │  │ Format           │ Parser                                     │  ││
│  │  ├──────────────────┼────────────────────────────────────────────┤  ││
│  │  │ CSV (Generic)    │ GenericCsvParser                           │  ││
│  │  │ CSV (mBank)      │ MBankCsvParser : GenericCsvParser          │  ││
│  │  │ CSV (PKO BP)     │ PkoBpCsvParser : GenericCsvParser          │  ││
│  │  │ HTML (mBank)     │ MBankHtmlParser                            │  ││
│  │  │ PDF (Generic)    │ PdfParser (future)                         │  ││
│  │  └──────────────────┴────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. PARSING & NORMALIZATION                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  interface ITransactionParser                                        ││
│  │  {                                                                   ││
│  │      bool CanParse(FileType fileType);                              ││
│  │      ParseResult Parse(Stream content, ParserOptions options);       ││
│  │  }                                                                   ││
│  │                                                                      ││
│  │  ParseResult:                                                        ││
│  │  {                                                                   ││
│  │      List<NormalizedTransaction> Transactions;                      ││
│  │      List<ParseError> Errors;                                       ││
│  │      ParserMetadata Metadata; // bank, date range, etc.             ││
│  │  }                                                                   ││
│  │                                                                      ││
│  │  NormalizedTransaction (intermediate model):                        ││
│  │  {                                                                   ││
│  │      DateTime Date;                                                  ││
│  │      decimal Amount;                                                 ││
│  │      string Currency;                                                ││
│  │      string Description;                                             ││
│  │      string? Merchant;                                               ││
│  │      Dictionary<string, object> RawFields;                          ││
│  │  }                                                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. DUPLICATE DETECTION                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Hash = SHA256(userId + date + amount + description[0:50])          ││
│  │                                                                      ││
│  │  Check against existing transaction hashes for user                 ││
│  │  Mark duplicates, don't import (but report count)                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. CATEGORIZATION (see Section 5)                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. PERSISTENCE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Batch write to Firestore (max 500 per batch)                       ││
│  │  Update import metadata with results                                ││
│  │  Store raw file in Cloud Storage for audit                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Parser Interface Design

```csharp
// Core abstractions (conceptual, not production code)

public interface ITransactionParser
{
    bool CanParse(FileTypeInfo fileType);
    int Priority { get; } // Higher = tried first
    Task<ParseResult> ParseAsync(Stream content, ParserContext context);
}

public record FileTypeInfo(
    string Format,           // "CSV", "HTML", "PDF"
    string? Encoding,        // "UTF-8", "Windows-1250"
    string? BankHint,        // "mBank", "PKO_BP", "Generic"
    string? FileName
);

public record ParserContext(
    string UserId,
    string DefaultCurrency,
    CultureInfo Culture,
    CancellationToken CancellationToken
);

public record ParseResult(
    IReadOnlyList<NormalizedTransaction> Transactions,
    IReadOnlyList<ParseError> Errors,
    ParseMetadata Metadata
);

public record ParseError(
    int? RowNumber,
    string Field,
    string Message,
    ParseErrorSeverity Severity
);

public enum ParseErrorSeverity { Warning, Error, Fatal }
```

### 4.3 Adding New Bank/Format Support

To add support for a new bank (e.g., Santander CSV):

1. **Create parser class:**
```csharp
public class SantanderCsvParser : BaseCsvParser
{
    public override bool CanParse(FileTypeInfo info) 
        => info.Format == "CSV" && info.BankHint == "Santander";
    
    public override int Priority => 100; // Bank-specific = high priority
    
    protected override CsvConfiguration GetConfiguration() 
        => new(new CultureInfo("pl-PL")) { Delimiter = ";" };
    
    protected override NormalizedTransaction MapRow(dynamic row)
    {
        // Bank-specific field mapping
    }
}
```

2. **Register in DI:**
```csharp
services.AddTransient<ITransactionParser, SantanderCsvParser>();
```

3. **Update bank detector (optional):**
```csharp
// Add header pattern recognition
if (headerLine.Contains("Santander")) return "Santander";
```

### 4.4 PDF Support Strategy (Future)

PDF parsing is complex and deferred to Phase 3. Strategy:

1. **Option A: Cloud-based OCR (Recommended)**
   - Use Google Document AI (has free tier: 1,000 pages/month)
   - Extract text/tables, then apply CSV-like parsing
   - Pros: Handles scanned PDFs, high accuracy
   - Cons: External dependency, some cost

2. **Option B: Local PDF parsing**
   - Use iText7 or PdfPig (.NET libraries)
   - Extract text programmatically
   - Pros: No external dependency, fully free
   - Cons: Only works for text-based PDFs, complex layout handling

3. **Hybrid approach:**
   - Try local parsing first
   - Fall back to Document AI for complex/scanned PDFs
   - User can choose in settings

### 4.5 Error Handling & Partial Failures

```
Import Outcome Scenarios:
┌─────────────────────────────────────────────────────────────────────────┐
│ Scenario              │ Behavior                                        │
├───────────────────────┼─────────────────────────────────────────────────┤
│ All rows parse OK     │ Status: "completed", all transactions saved     │
│ Some rows fail        │ Status: "completed", valid rows saved,          │
│                       │ errors[] contains failed rows                   │
│ Too many failures     │ Status: "failed" if >50% rows fail,            │
│ (>50%)                │ nothing saved, user must fix file               │
│ File unreadable       │ Status: "failed", errors[0] = file-level error │
│ Unknown format        │ Status: "failed", suggest manual format select │
└───────────────────────┴─────────────────────────────────────────────────┘
```

**User feedback:**
- Import summary shows: "Imported 142 transactions, skipped 3 duplicates, 2 errors"
- Errors are downloadable as JSON/CSV for user review
- User can retry with corrected file

---

## 5. Categorization Strategy

### 5.1 Categorization Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CATEGORIZATION PIPELINE                              │
│                   (Executed for each transaction)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: USER RULES (Highest Priority)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Query user's categorization rules, ordered by priority             ││
│  │  For each rule:                                                      ││
│  │    if (Matches(transaction.description, rule)) {                    ││
│  │      return { categoryId, source: "rule", confidence: 1.0 }         ││
│  │    }                                                                 ││
│  │                                                                      ││
│  │  Example rules:                                                      ││
│  │  • "ŻABKA" → Groceries (contains match)                             ││
│  │  • "SPOTIFY" → Entertainment (contains match)                       ││
│  │  • "^PRZELEW.*MAMA$" → Transfers (regex)                            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                          No match? ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: SYSTEM RULES (Medium Priority)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Global rules maintained by the application                         ││
│  │  Covers common merchants across all users                           ││
│  │                                                                      ││
│  │  Example system rules:                                               ││
│  │  • "BIEDRONKA|LIDL|AUCHAN|CARREFOUR" → Groceries                   ││
│  │  • "NETFLIX|SPOTIFY|HBO|DISNEY" → Entertainment                     ││
│  │  • "PZU|WARTA|ALLIANZ" → Insurance                                  ││
│  │  • "ORLEN|BP|SHELL|CIRCLE" → Fuel                                   ││
│  │                                                                      ││
│  │  return { categoryId, source: "auto", confidence: 0.9 }            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                          No match? ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: ML CLASSIFICATION (Future - Phase 3)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Call ML model with transaction description                         ││
│  │  Model trained on user's historical categorizations                 ││
│  │                                                                      ││
│  │  if (prediction.confidence > 0.7) {                                 ││
│  │    return { categoryId, source: "ml", confidence: prediction.conf }││
│  │  }                                                                   ││
│  │                                                                      ││
│  │  Implementation options:                                             ││
│  │  • Vertex AI AutoML (GCP) - has free tier                          ││
│  │  • ML.NET (runs in-process) - free, no external calls              ││
│  │  • Simple TF-IDF + Naive Bayes (built-in) - free                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                          No match? ▼                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: UNCATEGORIZED                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  return { categoryId: null, source: null, confidence: null }       ││
│  │                                                                      ││
│  │  Transaction appears in "Uncategorized" list in UI                  ││
│  │  User can manually categorize, optionally creating a rule           ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Default Categories (System)

```
├── 📥 Income
│   ├── 💰 Salary
│   ├── 🎁 Bonus
│   ├── 💸 Freelance
│   ├── 📈 Investments
│   └── 🔄 Refunds
│
├── 📤 Expenses
│   ├── 🏠 Housing
│   │   ├── Rent/Mortgage
│   │   ├── Utilities
│   │   └── Maintenance
│   ├── 🛒 Groceries
│   ├── 🍽️ Dining Out
│   ├── 🚗 Transportation
│   │   ├── Fuel
│   │   ├── Public Transit
│   │   └── Car Maintenance
│   ├── 🎬 Entertainment
│   │   ├── Streaming
│   │   ├── Games
│   │   └── Events
│   ├── 🛍️ Shopping
│   ├── 💊 Health
│   ├── 📚 Education
│   ├── 🛡️ Insurance
│   ├── 💳 Financial Fees
│   ├── 📱 Subscriptions
│   └── ❓ Other
│
└── 🔄 Transfers
    ├── Between Accounts
    ├── Savings
    └── Investments
```

### 5.3 Learning from User Corrections

When user manually categorizes a transaction:

```
1. User sets transaction.categoryId = "groceries" (was null or different)
2. User optionally checks "Create rule for similar transactions"
3. If checked:
   - Extract merchant/keyword from description
   - Create new categorization rule
   - Prompt: "Apply to X existing uncategorized transactions?"
4. Track categorySource = "manual" for ML training data
5. Increment rule.hitCount when rules match (for optimization)
```

### 5.4 ML Evolution Path (Phase 3)

**Recommended approach: ML.NET with text classification**

Why ML.NET:
- Runs in-process (no external API costs)
- Can train on user's data locally
- .NET native integration
- Supports incremental learning

**Training data:**
```
Input: Transaction descriptions with manual/rule categories
Features: TF-IDF on description text + amount buckets
Model: Multi-class classification (Naive Bayes or SdcaMaximumEntropy)
```

**Workflow:**
1. User accumulates 200+ manually categorized transactions
2. Background job trains model for that user
3. Model stored in Cloud Storage (per user)
4. Model loaded on next import for predictions
5. Low-confidence predictions still go to "Uncategorized"

---

## 6. API Design

### 6.1 API Overview

```
Base URL: https://api.budget.example.com/v1

Authentication: Bearer token (Firebase ID Token)
Content-Type: application/json (except file uploads)
```

### 6.2 Endpoints

#### Authentication & User

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/user/profile                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get current user's profile                                 │
│  Auth: Required                                                          │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "id": "firebase_uid_abc123",                                         │
│    "email": "user@example.com",                                         │
│    "displayName": "Jan Kowalski",                                       │
│    "defaultCurrency": "PLN",                                            │
│    "settings": {                                                         │
│      "theme": "dark",                                                   │
│      "dateFormat": "DD.MM.YYYY"                                         │
│    },                                                                    │
│    "createdAt": "2025-01-15T10:30:00Z"                                  │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PUT /api/v1/user/profile                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Update user profile                                        │
│  Auth: Required                                                          │
│  Request:                                                                │
│  {                                                                       │
│    "displayName": "Jan Kowalski",                                       │
│    "defaultCurrency": "EUR",                                            │
│    "settings": { "theme": "light" }                                     │
│  }                                                                       │
│  Response: 200 OK (updated profile)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### File Imports

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/imports                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Upload and process a transaction file                     │
│  Auth: Required                                                          │
│  Content-Type: multipart/form-data                                      │
│  Request:                                                                │
│    file: (binary)                                                       │
│    bankHint: "mBank" (optional, helps parser selection)                 │
│  Response: 202 Accepted (processing starts)                             │
│  {                                                                       │
│    "importId": "imp_abc123",                                            │
│    "status": "processing",                                              │
│    "fileName": "transactions_2025.csv"                                  │
│  }                                                                       │
│                                                                          │
│  Note: For small files, processing is synchronous and returns           │
│  completed result. For large files (>1000 rows), returns 202            │
│  and client polls for status.                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/imports/{importId}                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get import status and results                             │
│  Auth: Required                                                          │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "id": "imp_abc123",                                                  │
│    "status": "completed",                                               │
│    "fileName": "transactions_2025.csv",                                 │
│    "fileType": "CSV",                                                   │
│    "bankDetected": "mBank",                                             │
│    "transactionCount": 142,                                             │
│    "duplicatesSkipped": 3,                                              │
│    "categorizedCount": 128,                                             │
│    "uncategorizedCount": 14,                                            │
│    "dateRange": {                                                        │
│      "from": "2025-01-01",                                              │
│      "to": "2025-01-31"                                                 │
│    },                                                                    │
│    "errors": [                                                           │
│      { "row": 45, "message": "Invalid date format" }                    │
│    ],                                                                    │
│    "createdAt": "2025-02-01T10:30:00Z",                                 │
│    "completedAt": "2025-02-01T10:30:05Z"                                │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/imports                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: List all imports for user                                 │
│  Auth: Required                                                          │
│  Query params: ?status=completed&limit=20&cursor=xyz                    │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "items": [...],                                                      │
│    "nextCursor": "abc123",                                              │
│    "hasMore": true                                                      │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Transactions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/transactions                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: List transactions with filtering                          │
│  Auth: Required                                                          │
│  Query params:                                                           │
│    ?from=2025-01-01                                                     │
│    &to=2025-01-31                                                       │
│    &categoryId=cat_groceries                                            │
│    &uncategorizedOnly=true                                              │
│    &search=spotify                                                      │
│    &minAmount=-1000                                                     │
│    &maxAmount=-10                                                       │
│    &sort=date:desc                                                      │
│    &limit=50                                                            │
│    &cursor=xyz                                                          │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "items": [                                                           │
│      {                                                                   │
│        "id": "txn_123",                                                 │
│        "date": "2025-01-15",                                            │
│        "description": "SPOTIFY AB",                                     │
│        "amount": -29.99,                                                │
│        "currency": "PLN",                                               │
│        "category": {                                                     │
│          "id": "cat_entertainment",                                     │
│          "name": "Entertainment",                                       │
│          "icon": "🎬",                                                  │
│          "color": "#9333EA"                                             │
│        },                                                                │
│        "categorySource": "rule",                                        │
│        "merchant": "Spotify",                                           │
│        "importId": "imp_abc123"                                         │
│      }                                                                   │
│    ],                                                                    │
│    "nextCursor": "def456",                                              │
│    "hasMore": true,                                                     │
│    "totalCount": 1423                                                   │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PATCH /api/v1/transactions/{transactionId}                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Update transaction (category, notes, tags)                │
│  Auth: Required                                                          │
│  Request:                                                                │
│  {                                                                       │
│    "categoryId": "cat_groceries",                                       │
│    "notes": "Weekly shopping",                                          │
│    "tags": ["weekly", "family"],                                        │
│    "createRule": true  // Optional: create categorization rule         │
│  }                                                                       │
│  Response: 200 OK (updated transaction)                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/transactions/bulk-categorize                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Apply category to multiple transactions                   │
│  Auth: Required                                                          │
│  Request:                                                                │
│  {                                                                       │
│    "transactionIds": ["txn_1", "txn_2", "txn_3"],                       │
│    "categoryId": "cat_groceries"                                        │
│  }                                                                       │
│  Response: 200 OK                                                        │
│  { "updatedCount": 3 }                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Dashboard & Analytics

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/dashboard/summary                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get summary for dashboard widgets                         │
│  Auth: Required                                                          │
│  Query params: ?period=month&date=2025-01                               │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "period": { "from": "2025-01-01", "to": "2025-01-31" },             │
│    "totalIncome": 12500.00,                                             │
│    "totalExpenses": 8234.56,                                            │
│    "netSavings": 4265.44,                                               │
│    "savingsRate": 34.12,                                                │
│    "transactionCount": 142,                                             │
│    "uncategorizedCount": 5,                                             │
│    "previousPeriodComparison": {                                        │
│      "expenses": -5.2,  // 5.2% less than last month                   │
│      "income": 0.0                                                      │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/dashboard/by-category                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get spending breakdown by category                        │
│  Auth: Required                                                          │
│  Query params: ?period=month&date=2025-01&type=expense                  │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "period": { "from": "2025-01-01", "to": "2025-01-31" },             │
│    "categories": [                                                       │
│      {                                                                   │
│        "id": "cat_groceries",                                           │
│        "name": "Groceries",                                             │
│        "icon": "🛒",                                                    │
│        "color": "#22C55E",                                              │
│        "amount": 1850.00,                                               │
│        "percentage": 22.5,                                              │
│        "transactionCount": 24,                                          │
│        "budget": 2000.00,                                               │
│        "budgetUsed": 92.5                                               │
│      },                                                                  │
│      ...                                                                 │
│    ],                                                                    │
│    "uncategorized": {                                                    │
│      "amount": 234.00,                                                  │
│      "percentage": 2.8,                                                 │
│      "transactionCount": 5                                              │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/dashboard/trends                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get spending trends over time                             │
│  Auth: Required                                                          │
│  Query params: ?months=12&categoryId=cat_groceries (optional)           │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "dataPoints": [                                                       │
│      { "month": "2024-02", "income": 12000, "expenses": 8500 },        │
│      { "month": "2024-03", "income": 12500, "expenses": 7800 },        │
│      ...                                                                 │
│    ],                                                                    │
│    "averageMonthlyExpenses": 8234.00,                                   │
│    "averageMonthlyIncome": 12300.00                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Categories & Rules

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/categories                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get all categories (system + user custom)                 │
│  Auth: Required                                                          │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "categories": [                                                       │
│      {                                                                   │
│        "id": "cat_groceries",                                           │
│        "name": "Groceries",                                             │
│        "icon": "🛒",                                                    │
│        "color": "#22C55E",                                              │
│        "type": "expense",                                               │
│        "parentId": null,                                                │
│        "isSystem": true,                                                │
│        "budget": { "monthly": 2000 }                                    │
│      },                                                                  │
│      ...                                                                 │
│    ]                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/categories                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Create custom category                                    │
│  Auth: Required                                                          │
│  Request:                                                                │
│  {                                                                       │
│    "name": "Pet Expenses",                                              │
│    "icon": "🐕",                                                        │
│    "color": "#F59E0B",                                                  │
│    "type": "expense",                                                   │
│    "parentId": null,                                                    │
│    "budget": { "monthly": 500 }                                         │
│  }                                                                       │
│  Response: 201 Created                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/categorization-rules                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Get user's categorization rules                           │
│  Auth: Required                                                          │
│  Response: 200 OK                                                        │
│  {                                                                       │
│    "rules": [                                                           │
│      {                                                                   │
│        "id": "rule_123",                                                │
│        "categoryId": "cat_groceries",                                   │
│        "categoryName": "Groceries",                                     │
│        "matchType": "contains",                                         │
│        "matchField": "description",                                     │
│        "matchValue": "ŻABKA",                                           │
│        "priority": 100,                                                 │
│        "isActive": true,                                                │
│        "hitCount": 47                                                   │
│      }                                                                   │
│    ]                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/categorization-rules                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Description: Create categorization rule                                │
│  Auth: Required                                                          │
│  Request:                                                                │
│  {                                                                       │
│    "categoryId": "cat_entertainment",                                   │
│    "matchType": "contains",                                             │
│    "matchField": "description",                                         │
│    "matchValue": "CINEMA CITY",                                         │
│    "priority": 100,                                                     │
│    "applyToExisting": true  // Recategorize matching transactions      │
│  }                                                                       │
│  Response: 201 Created                                                  │
│  {                                                                       │
│    "rule": { ... },                                                     │
│    "appliedToCount": 12  // If applyToExisting was true                │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      { "field": "amount", "message": "Must be a valid number" },
      { "field": "date", "message": "Must be in ISO 8601 format" }
    ],
    "traceId": "abc123def456"
  }
}
```

**Standard error codes:**
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

## 7. CI/CD & Environments

### 7.1 Environment Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LOCAL DEVELOPMENT                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Frontend: Vite dev server (localhost:5173)                         ││
│  │  Backend:  .NET with hot reload (localhost:5000)                    ││
│  │  Database: Firestore Emulator (localhost:8080)                      ││
│  │  Storage:  Cloud Storage Emulator (localhost:9199)                  ││
│  │  Auth:     Firebase Auth Emulator (localhost:9099)                  ││
│  │                                                                      ││
│  │  docker-compose.yml for emulators                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    │ git push                            │
│                                    ▼                                     │
│  STAGING (Optional - same project, different config)                    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  URL: https://staging.budget.example.com                            ││
│  │  Triggered by: Push to 'develop' branch                             ││
│  │  Data: Separate Firestore collections (prefix: staging_)            ││
│  │  Auth: Firebase Auth (same project, use test accounts)              ││
│  │  Purpose: Integration testing before production                     ││
│  │                                                                      ││
│  │  Note: Can skip staging initially to save costs                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    │ PR merge to main                    │
│                                    ▼                                     │
│  PRODUCTION                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Frontend: https://budget.example.com (Firebase Hosting)            ││
│  │  Backend:  https://api.budget.example.com (Cloud Run)               ││
│  │  Database: Firestore (production)                                   ││
│  │  Storage:  Cloud Storage (production bucket)                        ││
│  │  Auth:     Firebase Auth (production)                               ││
│  │  Triggered by: Push to 'main' branch                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Repository Structure

```
budget-app/
├── .github/
│   └── workflows/
│       ├── ci.yml           # Build & test on all PRs
│       ├── deploy-api.yml   # Deploy backend to Cloud Run
│       └── deploy-web.yml   # Deploy frontend to Firebase
├── src/
│   ├── api/                 # ASP.NET Core project
│   │   ├── BudgetApp.Api/
│   │   ├── BudgetApp.Core/
│   │   ├── BudgetApp.Infrastructure/
│   │   ├── BudgetApp.Tests/
│   │   ├── Dockerfile
│   │   └── BudgetApp.sln
│   └── web/                 # React project
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── docs/
│   └── ARCHITECTURE.md      # This document
├── docker-compose.yml       # Local emulators
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

### 7.3 GitHub Actions Workflows

#### CI Pipeline (ci.yml)

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  # Backend jobs
  build-api:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --verbosity normal

  # Frontend jobs
  build-web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: src/web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
```

#### Deploy API (deploy-api.yml)

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'src/api/**'

env:
  PROJECT_ID: budget-app-prod
  REGION: europe-central2
  SERVICE_NAME: budget-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # For Workload Identity Federation
    
    steps:
      - uses: actions/checkout@v4
      
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
      
      - uses: google-github-actions/setup-gcloud@v2
      
      - name: Build and push container
        run: |
          gcloud builds submit src/api \
            --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:${{ github.sha }} \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --set-env-vars "GOOGLE_CLOUD_PROJECT=${{ env.PROJECT_ID }}"
```

#### Deploy Web (deploy-web.yml)

```yaml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - 'src/web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/web
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: src/web/package-lock.json
      
      - run: npm ci
      
      - run: npm run build
        env:
          VITE_API_URL: https://api.budget.example.com
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: budget-app-prod
          entryPoint: src/web
```

### 7.4 Local Development Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  firebase-emulators:
    image: ghcr.io/nicholasjackson/firebase-emulator:latest
    ports:
      - "4000:4000"   # Emulator UI
      - "8080:8080"   # Firestore
      - "9199:9199"   # Cloud Storage
    environment:
      - GCP_PROJECT=budget-app-dev
    volumes:
      - ./firebase.json:/app/firebase.json
      - ./firestore.rules:/app/firestore.rules
```

**Developer workflow:**
```bash
# Terminal 1: Start emulators
docker-compose up

# Terminal 2: Start backend
cd src/api/BudgetApp.Api
dotnet watch run

# Terminal 3: Start frontend
cd src/web
npm run dev
```

---

## 8. Cost Breakdown

### 8.1 Free Tier Limits (GCP + Firebase)

| Service | Free Tier | Limit Type |
|---------|-----------|------------|
| **Cloud Run** | 2M requests/month | Monthly |
| **Cloud Run** | 360,000 GB-seconds | Monthly |
| **Cloud Run** | 180,000 vCPU-seconds | Monthly |
| **Firestore** | 50,000 reads/day | Daily |
| **Firestore** | 20,000 writes/day | Daily |
| **Firestore** | 20,000 deletes/day | Daily |
| **Firestore** | 1 GiB storage | Total |
| **Cloud Storage** | 5 GB storage | Total |
| **Cloud Storage** | 1 GB egress/month | Monthly |
| **Firebase Hosting** | 10 GB storage | Total |
| **Firebase Hosting** | 360 MB/day transfer | Daily |
| **Firebase Auth** | Unlimited MAU | Forever |
| **Firebase Auth** | 10K phone verifications/month | Monthly |
| **GitHub Actions** | 2,000 mins/month (private) | Monthly |

### 8.2 Usage Estimation

#### Scenario: 1 Personal User

```
Daily usage estimate:
- Dashboard loads: 5
- Transaction list views: 10
- File imports: 0.1 (3/month)

Firestore reads per day:
- Dashboard summary: 1 aggregation query = ~100 reads
- Transaction list: ~50 reads per view × 10 = 500 reads
- Category/rule lookups: ~50 reads
Total: ~650 reads/day (1.3% of free tier)

Firestore writes per day:
- Transaction updates: ~5
- Profile updates: ~1
Total: ~6 writes/day (0.03% of free tier)

Cloud Run:
- API calls: ~50/day
- CPU time: ~30 seconds/day
Total: ~1,500/month (0.075% of free tier)

MONTHLY COST: $0.00
```

#### Scenario: 10 Active Users

```
Firestore reads: 6,500/day (13% of free tier)
Firestore writes: 60/day (0.3% of free tier)
Cloud Run: 15,000 requests/month (0.75% of free tier)

MONTHLY COST: $0.00
```

#### Scenario: 100 Active Users

```
Firestore reads: 65,000/day (130% of free tier - EXCEEDS)
  Overage: ~15,000 reads/day × 30 = 450,000 reads
  Cost: 450,000 × $0.036/100,000 = ~$0.16/month

Firestore writes: 600/day (3% of free tier)
Cloud Run: 150,000 requests/month (7.5% of free tier)
Storage: ~50 MB (1% of free tier)

MONTHLY COST: ~$0.50 - $2.00
```

### 8.3 Cost Optimization Strategies

1. **Aggressive caching** (TanStack Query)
   - Dashboard data cached for 5 minutes
   - Category list cached indefinitely (invalidate on change)
   - Reduces Firestore reads by 60-80%

2. **Pagination over full loads**
   - Never load all transactions at once
   - Use cursor-based pagination
   - Lazy load older data

3. **Aggregation at write time**
   - Store monthly summaries as documents
   - Update on transaction write (not computed on read)
   - Trades write cost for read savings (reads are 6× more expensive)

4. **Cold start optimization**
   - Minimal container size
   - Keep one instance warm with Cloud Scheduler (free tier: 3 jobs)

### 8.4 Cost Alerts

Set up GCP budget alerts:
- Warning at $1/month
- Critical at $5/month
- Auto-disable at $10/month (optional)

---

## 9. Implementation Roadmap

### Phase 1: MVP (4-6 weeks)

**Goal:** Working end-to-end flow for single user

```
Week 1-2: Foundation
├── ☐ Set up GitHub repository with CI/CD skeleton
├── ☐ Create GCP project, enable APIs, enable Firebase
├── ☐ Configure Firebase Auth (enable providers: Google, email/password)
├── ☐ Initialize React project (Vite + TypeScript)
├── ☐ Initialize ASP.NET Core project
├── ☐ Configure Firebase Auth integration (frontend + backend)
├── ☐ Set up Firebase Emulators for local dev
└── ☐ Implement basic user profile flow

Week 3-4: Core Import Flow
├── ☐ Design and implement data models (Firestore)
├── ☐ Build file upload API endpoint
├── ☐ Implement generic CSV parser
├── ☐ Implement one bank-specific parser (mBank CSV)
├── ☐ Build transaction normalization pipeline
├── ☐ Implement basic rule-based categorization
├── ☐ Create default category seed data
└── ☐ Build simple upload UI component

Week 5-6: Dashboard & Deployment
├── ☐ Implement transaction list API (with pagination)
├── ☐ Implement dashboard summary API
├── ☐ Build transaction list UI with filtering
├── ☐ Build dashboard with summary cards
├── ☐ Add one chart (monthly expenses bar chart)
├── ☐ Deploy to Cloud Run + Firebase Hosting
├── ☐ Set up custom domain (optional)
└── ☐ End-to-end testing

MVP Deliverables:
✓ User can log in with Firebase Auth (Google or email/password)
✓ User can upload mBank CSV file
✓ Transactions are parsed and categorized
✓ User can view transaction list
✓ User can see monthly summary
✓ Deployed and accessible
```

### Phase 2: UX & Polish (4-6 weeks)

**Goal:** Production-ready for personal daily use

```
Week 7-8: Enhanced Import
├── ☐ Add HTML parser (mBank statement)
├── ☐ Implement duplicate detection
├── ☐ Add import history view
├── ☐ Show import errors with details
├── ☐ Add second bank parser (PKO BP)
└── ☐ Manual file format selection fallback

Week 9-10: Categorization UX
├── ☐ Build categorization rule management UI
├── ☐ "Create rule" flow from transaction edit
├── ☐ Bulk categorization of uncategorized
├── ☐ Custom category creation
├── ☐ Category merge/delete
└── ☐ Apply rules to existing transactions

Week 11-12: Dashboard Enhancements
├── ☐ Category breakdown pie/donut chart
├── ☐ 12-month trend line chart
├── ☐ Month-over-month comparison
├── ☐ Date range picker
├── ☐ Responsive mobile layout
├── ☐ Dark mode support
└── ☐ Error boundary and loading states

Phase 2 Deliverables:
✓ Multiple file format support
✓ Robust error handling
✓ Full categorization workflow
✓ Rich dashboard visualizations
✓ Mobile-friendly
✓ Dark mode
```

### Phase 3: Advanced Features (6-8 weeks)

**Goal:** Smart features and extensibility

```
Week 13-15: Analytics & Budgeting
├── ☐ Budget setting per category
├── ☐ Budget vs actual tracking
├── ☐ Budget alerts (in-app)
├── ☐ Spending insights (unusual spending detection)
├── ☐ Recurring transaction detection
├── ☐ Year-over-year comparisons
└── ☐ Export to CSV/PDF

Week 16-18: ML Categorization
├── ☐ Collect training data from manual categorizations
├── ☐ Implement ML.NET text classifier
├── ☐ Train per-user models
├── ☐ Confidence-based auto-categorization
├── ☐ "Suggest category" UI for low confidence
└── ☐ Model retraining pipeline

Week 19-20: PDF & Polish
├── ☐ PDF parser integration (text-based)
├── ☐ Document AI fallback (OCR)
├── ☐ Multi-currency with exchange rates
├── ☐ Account-based organization
├── ☐ Performance optimization
└── ☐ Comprehensive error tracking (Sentry)

Phase 3 Deliverables:
✓ Budget tracking
✓ ML-powered categorization
✓ PDF import support
✓ Multi-currency
✓ Production monitoring
```

### Future Phases (Ideas)

```
Phase 4: Social & Sharing
├── ☐ Shared household budgets
├── ☐ Split expense tracking
└── ☐ Anonymized benchmarks ("You spend 20% less on dining than average")

Phase 5: Integrations
├── ☐ Bank API integrations (Open Banking / PSD2)
├── ☐ Crypto wallet tracking
└── ☐ Investment portfolio tracking

Phase 6: Platform
├── ☐ Mobile app (React Native)
├── ☐ API for third-party integrations
└── ☐ Webhooks for transaction events
```

---

## 10. Risks & Tradeoffs

### 10.1 Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Firestore query limits** | Can't do complex aggregations | Pre-compute summaries, use Cloud Functions for batch jobs |
| **Firestore no full-text search** | Transaction search is basic | Use Algolia (free tier) or client-side filtering for small datasets |
| **Firebase Auth basic features** | No enterprise SSO/SAML | Sufficient for personal use; can add Auth0 later if enterprise features needed |
| **Cloud Run cold starts** | First request may be slow (~2-5s) | Keep-warm with Cloud Scheduler; acceptable for personal use |
| **Single region** | Higher latency for global users | Use CDN for frontend; backend latency acceptable for non-realtime app |
| **No offline support** | Requires internet connection | PWA with service worker caching for read-only dashboard (future) |

### 10.2 Technical Debt Risks

| Risk | Likelihood | Impact | Prevention Strategy |
|------|------------|--------|---------------------|
| **Parser complexity explosion** | Medium | High | Strong interface contracts; one parser per bank; don't over-generalize |
| **Category model changes** | Low | Medium | Avoid breaking changes; use soft deletes; version categories if needed |
| **Firebase Auth vendor lock-in** | Low | Low | Standard JWT/OIDC; can migrate to Auth0/Cognito if needed |
| **Firestore schema issues** | Medium | High | Plan migrations carefully; use backwards-compatible changes |

### 10.3 What Might Need Refactoring Later

1. **Move to SQL if queries get complex**
   - Sign: Firestore read costs spike, need for complex joins
   - Solution: Migrate to Cloud SQL (PostgreSQL) or AlloyDB
   - Effort: 2-3 weeks

2. **Split BFF into microservices**
   - Sign: Single API becomes >10K lines, deploy times increase
   - Solution: Extract parser service, analytics service
   - Effort: 4-6 weeks

3. **Add message queue for imports**
   - Sign: Large file imports timeout, need for retries
   - Solution: Cloud Pub/Sub + Cloud Functions for async processing
   - Effort: 1-2 weeks

4. **Replace ML.NET with cloud ML**
   - Sign: Model training too slow, need for GPU
   - Solution: Vertex AI AutoML or custom model on Cloud Run GPU
   - Effort: 2-4 weeks

### 10.4 Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Multi-tenant data isolation** | Every Firestore query includes `userId` filter; security rules enforce access |
| **File upload attacks** | Validate file size, type, and content before processing |
| **JWT security** | Validate signature, issuer, audience; short expiry; refresh token rotation |
| **Sensitive data in logs** | Never log transaction descriptions or amounts; structured logging |
| **CORS** | Strict origin whitelist; no wildcards in production |
| **Rate limiting** | Implement in Cloud Run or use Cloud Armor (free tier available) |

### 10.5 Decision Log

| Decision | Alternatives Considered | Rationale |
|----------|------------------------|-----------|
| **Firestore over PostgreSQL** | Cloud SQL, Supabase | Free tier, serverless, sufficient for app needs |
| **Firebase Auth over Auth0** | Auth0, Supabase Auth | Unlimited free MAU, native GCP integration, simpler architecture |
| **Cloud Run over Cloud Functions** | Cloud Functions, App Engine | Full .NET support, longer timeout, easier debugging |
| **React over Vue/Svelte** | Vue 3, SvelteKit | Team expertise, larger ecosystem |
| **REST over GraphQL** | GraphQL, gRPC | Simpler, sufficient for needs, less overhead |
| **Vite over Next.js** | Next.js, Create React App | SPA is sufficient; no SSR needed; faster DX |

---

## 11. Additional Considerations

### 11.1 Testing Strategy

| Layer | Testing Approach | Tools |
|-------|-----------------|-------|
| **Frontend Unit** | Component testing, hook testing | Vitest, React Testing Library |
| **Frontend E2E** | Critical user flows | Playwright (free, fast) |
| **Backend Unit** | Service/parser logic | xUnit, Moq |
| **Backend Integration** | API endpoints with emulators | WebApplicationFactory, Firestore Emulator |
| **Contract Testing** | API schema validation | Optional: Pact or OpenAPI validation |

**Recommended test coverage targets:**
- Parsers: 90%+ (critical path)
- Categorization engine: 80%+
- API controllers: 70%+
- Frontend components: 60%+

### 11.2 Observability & Monitoring

**Logging (Free):**
- Cloud Run logs automatically sent to Cloud Logging
- Structured logging with correlation IDs
- Log-based alerting for errors

**Metrics (Free tier):**
- Cloud Run built-in metrics (request count, latency, memory)
- Custom metrics via OpenTelemetry (limited free tier)

**Error Tracking (Recommended):**
- **Sentry** (free tier: 5K errors/month) - excellent for both frontend and backend
- Alternative: Cloud Error Reporting (free, but less featured)

**Alerting:**
- Set up alerts for: error rate spikes, high latency, failed deployments
- Use Google Cloud Monitoring (free tier sufficient)

### 11.3 Data Backup & Recovery

**Firestore:**
- Enable Point-in-Time Recovery (PITR) - 7 days retention (costs ~$0.10/GB/month)
- Or: Scheduled exports to Cloud Storage (free, but manual restore)
- Recommendation: Start with scheduled exports, add PITR if data grows

**Cloud Storage (uploaded files):**
- Enable versioning for accidental delete protection
- Set lifecycle rule: delete versions older than 30 days

**Backup script example (Cloud Scheduler + Cloud Functions):**
```
Daily at 2 AM: Export Firestore to gs://budget-app-backups/
Weekly: Copy to separate backup bucket
Monthly: Archive to Coldline storage
```

### 11.4 Accessibility (a11y)

- Use Shadcn/ui components (built on Radix, WCAG compliant)
- Test with keyboard navigation
- Ensure color contrast ratios meet WCAG AA
- Add ARIA labels to charts
- Support reduced motion preferences

### 11.5 Internationalization (i18n) Strategy

**Phase 1 (MVP):** Polish only, hardcoded strings
**Phase 2:** Extract strings to JSON files, add English
**Recommended library:** react-i18next (lightweight, good DX)

**Number/Date formatting:**
- Use `Intl.NumberFormat` and `Intl.DateTimeFormat` from day 1
- Respect user's locale setting in profile
- Store dates as UTC in database, convert on display

### 11.6 Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Lighthouse Performance** | >90 | CI check on PRs |
| **First Contentful Paint** | <1.5s | Core Web Vitals |
| **Time to Interactive** | <3s | Core Web Vitals |
| **Bundle Size (JS)** | <200KB gzipped | Build output |
| **API Response (p95)** | <500ms | Cloud Monitoring |
| **Cold Start** | <3s | Cloud Run metrics |

**Strategies to achieve:**
- Code splitting by route (React.lazy)
- Image optimization (if applicable)
- TanStack Query caching
- Cloud Run min instances = 0 (accept cold starts for cost savings)

### 11.7 GDPR & Privacy Considerations

| Requirement | Implementation |
|-------------|----------------|
| **Data Export** | API endpoint to export all user data as JSON |
| **Data Deletion** | API endpoint to delete user and all subcollections |
| **Consent** | Privacy policy acceptance on signup |
| **Data Minimization** | Don't store unnecessary PII |
| **Encryption** | GCP encrypts at rest by default; TLS for transit |

**User data deletion flow:**
1. User requests deletion via UI
2. API soft-deletes user (sets `deletedAt` timestamp)
3. Background job (Cloud Scheduler) permanently deletes after 30 days
4. Cancel deletion possible within 30 days

### 11.8 Mobile App Future Path

If mobile app is needed later, recommended approaches:

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **PWA** | Free, same codebase | Limited native features | 1-2 weeks |
| **React Native** | Native feel, shared logic | Separate codebase | 6-8 weeks |
| **Capacitor** | Wrap existing React app | Performance limitations | 2-3 weeks |

**Recommendation:** Start with PWA (add manifest, service worker) — free and provides basic mobile experience. Evaluate React Native only if native features (camera for receipts, widgets) are critical.

---

## 12. Repository Structure & Infrastructure Setup

### 12.1 Monorepo vs Polyrepo Decision

**Decision: Monorepo** — Single repository for all code

| Factor | Monorepo | Polyrepo | Winner |
|--------|----------|----------|--------|
| **Atomic changes** | Single PR updates frontend + backend | Coordinated PRs across repos | ✅ Monorepo |
| **Code sharing** | Easy to share types/contracts | Requires publishing packages | ✅ Monorepo |
| **CI/CD complexity** | Path-based triggers | Simpler per-repo pipelines | Polyrepo |
| **Team scaling** | Can get complex at 50+ devs | Better isolation | Polyrepo |
| **For 1-5 developers** | Much simpler | Overkill | ✅ Monorepo |

### 12.2 Repository Structure

```
budget-app/
│
├── 📁 .github/
│   ├── 📁 workflows/
│   │   ├── ci.yml                    # Build + test on all PRs
│   │   ├── deploy-api.yml            # Deploy backend to Cloud Run
│   │   ├── deploy-web.yml            # Deploy frontend to Firebase Hosting
│   │   └── deploy-infra.yml          # Apply Terraform changes
│   ├── 📁 ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── CODEOWNERS                    # Auto-assign reviewers
│   └── dependabot.yml                # Automated dependency updates
│
├── 📁 src/
│   │
│   ├── 📁 api/                       # ASP.NET Core Backend
│   │   ├── 📁 BudgetApp.Api/         # Web API project (controllers, middleware)
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   ├── Program.cs
│   │   │   ├── appsettings.json
│   │   │   └── BudgetApp.Api.csproj
│   │   │
│   │   ├── 📁 BudgetApp.Core/        # Domain logic (entities, interfaces)
│   │   │   ├── Entities/
│   │   │   ├── Interfaces/
│   │   │   ├── Services/
│   │   │   └── BudgetApp.Core.csproj
│   │   │
│   │   ├── 📁 BudgetApp.Infrastructure/  # External concerns (Firestore, Storage)
│   │   │   ├── Firestore/
│   │   │   ├── Storage/
│   │   │   ├── Parsing/
│   │   │   └── BudgetApp.Infrastructure.csproj
│   │   │
│   │   ├── 📁 BudgetApp.Tests/       # Unit + integration tests
│   │   │   ├── Unit/
│   │   │   ├── Integration/
│   │   │   └── BudgetApp.Tests.csproj
│   │   │
│   │   ├── Dockerfile                # Multi-stage build for Cloud Run
│   │   ├── .dockerignore
│   │   └── BudgetApp.sln
│   │
│   └── 📁 web/                       # React Frontend
│       ├── 📁 src/
│       │   ├── 📁 components/        # Reusable UI components
│       │   │   ├── ui/               # Shadcn/ui components
│       │   │   └── common/           # App-specific shared components
│       │   ├── 📁 features/          # Feature-based modules
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── transactions/
│       │   │   ├── imports/
│       │   │   └── categories/
│       │   ├── 📁 hooks/             # Custom React hooks
│       │   ├── 📁 lib/               # Utilities, API client, Firebase config
│       │   ├── 📁 types/             # TypeScript type definitions
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── 📁 public/
│       ├── 📁 tests/                 # Vitest + Testing Library
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── firebase.json             # Firebase Hosting config
│
├── 📁 infra/                         # Infrastructure as Code
│   ├── 📁 terraform/                 # Terraform configurations
│   │   ├── 📁 modules/
│   │   │   ├── 📁 cloud-run/
│   │   │   ├── 📁 firestore/
│   │   │   ├── 📁 storage/
│   │   │   └── 📁 iam/
│   │   ├── 📁 environments/
│   │   │   ├── 📁 dev/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   └── 📁 prod/
│   │   │       ├── main.tf
│   │   │       ├── variables.tf
│   │   │       └── terraform.tfvars
│   │   └── backend.tf                # Remote state in GCS
│   │
│   └── 📁 firebase/                  # Firebase-specific configs
│       ├── firestore.rules
│       ├── firestore.indexes.json
│       ├── storage.rules
│       └── firebase.json
│
├── 📁 docs/                          # Documentation
│   ├── ARCHITECTURE.md               # This document
│   ├── API.md                        # API documentation
│   ├── DEVELOPMENT.md                # Local setup guide
│   └── DEPLOYMENT.md                 # Deployment procedures
│
├── 📁 scripts/                       # Utility scripts
│   ├── setup-local.ps1               # Windows setup script
│   ├── setup-local.sh                # Linux/Mac setup script
│   ├── seed-categories.js            # Seed default categories
│   └── backup-firestore.sh           # Manual backup script
│
├── docker-compose.yml                # Local development (Firebase emulators)
├── docker-compose.override.yml       # Local overrides (gitignored)
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE
```

### 12.3 Infrastructure as Code Strategy

**Decision: Terraform + Firebase CLI hybrid approach**

| Resource | Tool | Reason |
|----------|------|--------|
| **GCP Project** | Terraform | Reproducible, version controlled |
| **Cloud Run** | Terraform | Complex config, IAM bindings |
| **Cloud Storage** | Terraform | Lifecycle policies, IAM |
| **Firestore** | Firebase CLI | Security rules, indexes |
| **Firebase Auth** | Firebase Console + CLI | Provider config via console |
| **Firebase Hosting** | Firebase CLI | Integrated with GitHub Actions |

#### Terraform State Management

```hcl
# infra/terraform/backend.tf
terraform {
  backend "gcs" {
    bucket = "budget-app-terraform-state"
    prefix = "terraform/state"
  }
}
```

**State bucket setup (one-time, manual):**
```bash
# Create state bucket before first Terraform run
gcloud storage buckets create gs://budget-app-terraform-state \
  --location=europe-central2 \
  --uniform-bucket-level-access
```

---

## 13. Platform Setup Guide

### 13.1 Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORMS TO CONFIGURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │     GITHUB      │    │  GOOGLE CLOUD   │    │    FIREBASE     │          │
│  │                 │    │    PLATFORM     │    │                 │          │
│  │ • Repository    │    │                 │    │ • Auth          │          │
│  │ • Actions       │    │ • Project       │    │ • Hosting       │          │
│  │ • Secrets       │    │ • Cloud Run     │    │ • Firestore*    │          │
│  │ • Environments  │    │ • Cloud Storage │    │ • Emulators     │          │
│  │                 │    │ • IAM           │    │                 │          │
│  │                 │    │ • Artifact Reg  │    │ * Same as GCP   │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│          │                      │                      │                     │
│          │                      │                      │                     │
│          └──────────────────────┴──────────────────────┘                     │
│                                 │                                            │
│                    Workload Identity Federation                              │
│                    (GitHub ↔ GCP authentication)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Firebase Console vs GCP Console

| Task | Firebase Console | GCP Console | Notes |
|------|------------------|-------------|-------|
| **Create project** | ✅ Start here | Auto-created | Firebase creates underlying GCP project |
| **Enable Auth** | ✅ | ❌ | Firebase only |
| **Configure auth providers** | ✅ | ❌ | Google, email/password |
| **Firestore database** | ✅ | Also visible | Either works |
| **Firestore security rules** | ✅ | ❌ | Firebase only |
| **Firebase Hosting** | ✅ | ❌ | Firebase only |
| **Cloud Run** | ❌ | ✅ | GCP only |
| **Cloud Storage** | ✅ (limited) | ✅ (full) | GCP for advanced config |
| **IAM & Service Accounts** | ❌ | ✅ | GCP only |
| **Billing** | Redirects to GCP | ✅ | GCP only |
| **Cloud Build** | ❌ | ✅ | GCP only |
| **Artifact Registry** | ❌ | ✅ | GCP only |
| **Cloud Scheduler** | ❌ | ✅ | GCP only |
| **Monitoring & Logging** | ❌ | ✅ | GCP only |

**Summary:** Start in Firebase Console, switch to GCP Console for backend infrastructure.

### 13.3 Complete Setup Roadmap

---

## 🚀 SETUP ROADMAP

### Phase 0: Prerequisites (30 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 0.1: Install Required Tools                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Local Machine Requirements:                                                 │
│  ☐ Node.js 20+ (https://nodejs.org)                                         │
│  ☐ .NET 8 SDK (https://dot.net)                                             │
│  ☐ Docker Desktop (https://docker.com)                                      │
│  ☐ Git (https://git-scm.com)                                                │
│  ☐ VS Code + recommended extensions                                         │
│                                                                              │
│  CLI Tools:                                                                  │
│  ☐ Google Cloud CLI: https://cloud.google.com/sdk/docs/install             │
│  ☐ Firebase CLI: npm install -g firebase-tools                              │
│  ☐ Terraform: https://terraform.io/downloads (optional for IaC)            │
│                                                                              │
│  Verify installations:                                                       │
│  $ node --version     # v20.x.x                                             │
│  $ dotnet --version   # 8.x.x                                               │
│  $ docker --version   # 24.x.x+                                             │
│  $ gcloud --version   # Google Cloud SDK 4xx.x.x                            │
│  $ firebase --version # 13.x.x                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: GitHub Setup (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1.1: Create Repository                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: github.com                                                        │
│                                                                              │
│  ☐ Go to github.com → New Repository                                        │
│  ☐ Name: budget-app                                                         │
│  ☐ Visibility: Private (recommended) or Public                              │
│  ☐ Initialize with README: Yes                                              │
│  ☐ Add .gitignore: None (we'll add custom)                                  │
│  ☐ License: MIT (or your preference)                                        │
│                                                                              │
│  Clone locally:                                                              │
│  $ git clone https://github.com/YOUR_USERNAME/budget-app.git                │
│  $ cd budget-app                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1.2: Configure Branch Protection (Optional but Recommended)           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: github.com → Repository → Settings → Branches                    │
│                                                                              │
│  ☐ Add branch protection rule for 'main':                                   │
│    ☐ Require pull request reviews before merging                            │
│    ☐ Require status checks to pass (CI workflow)                            │
│    ☐ Require branches to be up to date                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 2: Firebase Project Setup (20 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.1: Create Firebase Project                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.firebase.google.com                                       │
│                                                                              │
│  ☐ Go to Firebase Console → Add Project                                     │
│  ☐ Project name: budget-app-prod (or your preference)                       │
│  ☐ Google Analytics: Disable (not needed, reduces complexity)               │
│  ☐ Accept terms → Create Project                                            │
│                                                                              │
│  📝 Note your Project ID: _______________________                           │
│     (e.g., budget-app-prod-abc123)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.2: Upgrade to Blaze Plan (Required for Cloud Run)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.firebase.google.com → Project → ⚙️ → Usage and billing   │
│                                                                              │
│  ☐ Click "Modify plan"                                                      │
│  ☐ Select "Blaze (pay as you go)"                                          │
│  ☐ Set up billing account (credit card required)                            │
│                                                                              │
│  ⚠️  Don't worry! You'll stay in free tier limits.                          │
│      Set up budget alerts next to avoid surprises.                          │
│                                                                              │
│  ☐ Go to GCP Console → Billing → Budgets & Alerts                          │
│  ☐ Create budget: $5/month with alerts at 50%, 90%, 100%                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.3: Enable Firebase Authentication                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.firebase.google.com → Build → Authentication             │
│                                                                              │
│  ☐ Click "Get Started"                                                      │
│  ☐ Enable sign-in providers:                                                │
│                                                                              │
│    Provider: Email/Password                                                 │
│    ☐ Enable Email/Password: ON                                             │
│    ☐ Email link (passwordless): OFF (optional, enable later)               │
│    ☐ Save                                                                   │
│                                                                              │
│    Provider: Google                                                         │
│    ☐ Enable: ON                                                             │
│    ☐ Project support email: your-email@gmail.com                            │
│    ☐ Save                                                                   │
│                                                                              │
│  ☐ Go to Settings → Authorized domains                                      │
│  ☐ Add your production domain (later): budget.yourdomain.com               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.4: Create Firestore Database                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.firebase.google.com → Build → Firestore Database        │
│                                                                              │
│  ☐ Click "Create Database"                                                  │
│  ☐ Security rules: Start in TEST MODE (we'll update later)                 │
│  ☐ Location: europe-central2 (Warsaw) or your preferred region             │
│                                                                              │
│  ⚠️  IMPORTANT: Choose location carefully - cannot be changed later!        │
│                                                                              │
│  📝 Note your region: _______________________                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.5: Register Web App & Get Config                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.firebase.google.com → Project Settings → General        │
│                                                                              │
│  ☐ Scroll to "Your apps" → Click web icon (</>)                            │
│  ☐ App nickname: budget-web                                                 │
│  ☐ Also set up Firebase Hosting: YES ✓                                     │
│  ☐ Register App                                                             │
│                                                                              │
│  ☐ Copy the Firebase config object:                                         │
│                                                                              │
│  const firebaseConfig = {                                                   │
│    apiKey: "AIzaSy...",                      ← 📝 Copy these values         │
│    authDomain: "budget-app-prod.firebaseapp.com",                           │
│    projectId: "budget-app-prod",                                            │
│    storageBucket: "budget-app-prod.appspot.com",                            │
│    messagingSenderId: "123456789",                                          │
│    appId: "1:123456789:web:abc123"                                          │
│  };                                                                          │
│                                                                              │
│  Save these for GitHub Secrets later!                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.6: Initialize Firebase in Repository                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal (local)                                                  │
│                                                                              │
│  # Login to Firebase                                                        │
│  $ firebase login                                                           │
│                                                                              │
│  # Initialize in project root                                               │
│  $ cd budget-app                                                            │
│  $ firebase init                                                            │
│                                                                              │
│  Select features (spacebar to toggle):                                      │
│  ☐ Firestore: Configure security rules and indexes                         │
│  ☐ Hosting: Configure files for Firebase Hosting                           │
│  ☐ Emulators: Set up local emulators                                       │
│                                                                              │
│  Configuration choices:                                                      │
│  • Use existing project → budget-app-prod                                   │
│  • Firestore rules file → infra/firebase/firestore.rules                   │
│  • Firestore indexes file → infra/firebase/firestore.indexes.json          │
│  • Hosting public directory → src/web/dist                                  │
│  • Single-page app → Yes                                                    │
│  • Automatic builds with GitHub → No (we'll set up manually)               │
│  • Emulators → Auth, Firestore, Storage                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: GCP Console Setup (30 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.1: Enable Required APIs                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → APIs & Services → Library            │
│                                                                              │
│  Enable these APIs (search and enable each):                                │
│                                                                              │
│  ☐ Cloud Run Admin API                                                      │
│  ☐ Cloud Build API                                                          │
│  ☐ Artifact Registry API                                                    │
│  ☐ Secret Manager API                                                       │
│  ☐ Cloud Scheduler API (for background jobs)                               │
│  ☐ Identity and Access Management (IAM) API                                │
│                                                                              │
│  Note: Firestore & Cloud Storage are auto-enabled via Firebase              │
│                                                                              │
│  Quick CLI alternative:                                                      │
│  $ gcloud services enable \                                                 │
│      run.googleapis.com \                                                   │
│      cloudbuild.googleapis.com \                                            │
│      artifactregistry.googleapis.com \                                      │
│      secretmanager.googleapis.com \                                         │
│      cloudscheduler.googleapis.com \                                        │
│      iam.googleapis.com \                                                   │
│      --project=budget-app-prod                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.2: Create Artifact Registry Repository                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → Artifact Registry                     │
│                                                                              │
│  ☐ Click "Create Repository"                                               │
│  ☐ Name: budget-app                                                         │
│  ☐ Format: Docker                                                           │
│  ☐ Mode: Standard                                                           │
│  ☐ Location type: Region                                                    │
│  ☐ Region: europe-central2 (same as Firestore)                             │
│  ☐ Create                                                                   │
│                                                                              │
│  📝 Note your registry path:                                                │
│     europe-central2-docker.pkg.dev/budget-app-prod/budget-app              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.3: Create Cloud Storage Bucket for Uploads                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → Cloud Storage → Buckets              │
│                                                                              │
│  ☐ Click "Create"                                                           │
│  ☐ Name: budget-app-prod-uploads (must be globally unique)                 │
│  ☐ Location type: Region                                                    │
│  ☐ Region: europe-central2                                                  │
│  ☐ Storage class: Standard                                                  │
│  ☐ Access control: Uniform (recommended)                                   │
│  ☐ Protection: None                                                         │
│  ☐ Create                                                                   │
│                                                                              │
│  After creation, add lifecycle rule:                                        │
│  ☐ Go to bucket → Lifecycle                                                │
│  ☐ Add rule: Delete objects older than 365 days                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.4: Create Service Account for Cloud Run                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → IAM & Admin → Service Accounts       │
│                                                                              │
│  ☐ Click "Create Service Account"                                          │
│  ☐ Name: budget-api-runtime                                                │
│  ☐ ID: budget-api-runtime                                                  │
│  ☐ Description: Service account for Budget API Cloud Run service           │
│                                                                              │
│  ☐ Grant roles:                                                             │
│    • Cloud Datastore User (for Firestore)                                  │
│    • Storage Object Admin (for GCS uploads)                                │
│    • Firebase Authentication Admin                                          │
│                                                                              │
│  ☐ Create                                                                   │
│                                                                              │
│  📝 Note the email:                                                         │
│     budget-api-runtime@budget-app-prod.iam.gserviceaccount.com             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.5: Set Up Workload Identity Federation (GitHub → GCP)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → IAM & Admin → Workload Identity Fed. │
│                                                                              │
│  This allows GitHub Actions to authenticate to GCP without storing keys!   │
│                                                                              │
│  ☐ Create Pool:                                                             │
│    • Name: github-actions                                                   │
│    • Pool ID: github-actions                                               │
│    • Create                                                                 │
│                                                                              │
│  ☐ Add Provider:                                                            │
│    • Provider type: OpenID Connect (OIDC)                                  │
│    • Provider name: github                                                 │
│    • Provider ID: github                                                   │
│    • Issuer URL: https://token.actions.githubusercontent.com               │
│    • Default audience: Leave default                                       │
│                                                                              │
│  ☐ Configure attribute mapping:                                            │
│    google.subject = assertion.sub                                          │
│    attribute.actor = assertion.actor                                       │
│    attribute.repository = assertion.repository                              │
│                                                                              │
│  ☐ Add attribute condition (security!):                                    │
│    assertion.repository == "YOUR_USERNAME/budget-app"                       │
│                                                                              │
│  📝 Note the Provider resource name (looks like):                           │
│     projects/123456789/locations/global/workloadIdentityPools/             │
│     github-actions/providers/github                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.6: Create Service Account for GitHub Actions                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.cloud.google.com → IAM & Admin → Service Accounts       │
│                                                                              │
│  ☐ Click "Create Service Account"                                          │
│  ☐ Name: github-actions-deployer                                           │
│  ☐ ID: github-actions-deployer                                             │
│                                                                              │
│  ☐ Grant roles:                                                             │
│    • Cloud Run Admin                                                        │
│    • Artifact Registry Writer                                               │
│    • Cloud Build Editor                                                     │
│    • Service Account User                                                   │
│    • Storage Admin (for Terraform state)                                   │
│                                                                              │
│  ☐ After creation, go to the service account → Permissions                 │
│  ☐ Click "Grant Access"                                                    │
│  ☐ Principal: principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/   │
│              locations/global/workloadIdentityPools/github-actions/         │
│              attribute.repository/YOUR_USERNAME/budget-app                   │
│  ☐ Role: Workload Identity User                                            │
│                                                                              │
│  📝 Note the email:                                                         │
│     github-actions-deployer@budget-app-prod.iam.gserviceaccount.com        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 4: GitHub Secrets Configuration (10 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4.1: Add Repository Secrets                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: github.com → Repository → Settings → Secrets → Actions          │
│                                                                              │
│  Add these repository secrets:                                              │
│                                                                              │
│  ┌─────────────────────────────┬────────────────────────────────────────┐  │
│  │ Secret Name                 │ Value                                  │  │
│  ├─────────────────────────────┼────────────────────────────────────────┤  │
│  │ GCP_PROJECT_ID              │ budget-app-prod                        │  │
│  │ GCP_REGION                  │ europe-central2                        │  │
│  │ GCP_WORKLOAD_IDENTITY_      │ projects/123.../providers/github       │  │
│  │   PROVIDER                  │ (from Step 3.5)                        │  │
│  │ GCP_SERVICE_ACCOUNT         │ github-actions-deployer@...            │  │
│  │                             │ (from Step 3.6)                        │  │
│  │ FIREBASE_SERVICE_ACCOUNT    │ (JSON key - see note below)            │  │
│  │ VITE_FIREBASE_API_KEY       │ AIzaSy... (from Step 2.5)              │  │
│  │ VITE_FIREBASE_AUTH_DOMAIN   │ budget-app-prod.firebaseapp.com       │  │
│  │ VITE_FIREBASE_PROJECT_ID    │ budget-app-prod                        │  │
│  │ VITE_FIREBASE_STORAGE_      │ budget-app-prod.appspot.com           │  │
│  │   BUCKET                    │                                        │  │
│  │ VITE_FIREBASE_MESSAGING_    │ 123456789                              │  │
│  │   SENDER_ID                 │                                        │  │
│  │ VITE_FIREBASE_APP_ID        │ 1:123456789:web:abc123                 │  │
│  └─────────────────────────────┴────────────────────────────────────────┘  │
│                                                                              │
│  For FIREBASE_SERVICE_ACCOUNT:                                              │
│  ☐ Go to Firebase Console → Project Settings → Service Accounts            │
│  ☐ Click "Generate new private key"                                        │
│  ☐ Copy entire JSON content as secret value                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4.2: Add Environment Variables (Optional)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: github.com → Repository → Settings → Environments               │
│                                                                              │
│  Create environments for additional protection:                             │
│                                                                              │
│  ☐ Create "production" environment                                          │
│    • Required reviewers: Add yourself                                      │
│    • Deployment branches: Only 'main'                                      │
│    • Add environment-specific secrets if needed                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Local Development Setup (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.1: Clone and Install Dependencies                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal (local)                                                  │
│                                                                              │
│  # Clone repository                                                         │
│  $ git clone https://github.com/YOUR_USERNAME/budget-app.git                │
│  $ cd budget-app                                                            │
│                                                                              │
│  # Install frontend dependencies                                            │
│  $ cd src/web                                                               │
│  $ npm install                                                              │
│  $ cd ../..                                                                 │
│                                                                              │
│  # Restore backend dependencies                                             │
│  $ cd src/api                                                               │
│  $ dotnet restore                                                           │
│  $ cd ../..                                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.2: Configure Local Environment                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal + Editor                                                 │
│                                                                              │
│  # Create frontend .env.local                                               │
│  $ cat > src/web/.env.local << 'EOF'                                        │
│  VITE_API_URL=http://localhost:5000                                         │
│  VITE_FIREBASE_API_KEY=fake-api-key                                         │
│  VITE_FIREBASE_AUTH_DOMAIN=localhost                                        │
│  VITE_FIREBASE_PROJECT_ID=budget-app-dev                                    │
│  VITE_USE_EMULATORS=true                                                    │
│  EOF                                                                        │
│                                                                              │
│  # Create backend appsettings.Development.json                              │
│  (Already configured to use emulators when ASPNETCORE_ENVIRONMENT=Dev)     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.3: Start Local Development                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal (3 terminals needed)                                    │
│                                                                              │
│  Terminal 1 - Firebase Emulators:                                           │
│  $ firebase emulators:start                                                 │
│  # Runs Auth on :9099, Firestore on :8080, Storage on :9199                │
│  # Emulator UI available at http://localhost:4000                          │
│                                                                              │
│  Terminal 2 - Backend API:                                                  │
│  $ cd src/api/BudgetApp.Api                                                 │
│  $ dotnet watch run                                                         │
│  # API available at http://localhost:5000                                  │
│                                                                              │
│  Terminal 3 - Frontend:                                                     │
│  $ cd src/web                                                               │
│  $ npm run dev                                                              │
│  # App available at http://localhost:5173                                  │
│                                                                              │
│  ✅ Open http://localhost:5173 - you should see the app!                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 6: First Deployment (20 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.1: Deploy Firestore Security Rules                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal                                                          │
│                                                                              │
│  $ firebase deploy --only firestore:rules                                   │
│  $ firebase deploy --only firestore:indexes                                 │
│                                                                              │
│  Verify in Firebase Console → Firestore → Rules                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.2: Manual First Deploy - Backend                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal                                                          │
│                                                                              │
│  # Authenticate with GCP                                                    │
│  $ gcloud auth login                                                        │
│  $ gcloud config set project budget-app-prod                                │
│                                                                              │
│  # Build and push container                                                 │
│  $ cd src/api                                                               │
│  $ gcloud builds submit \                                                   │
│      --tag europe-central2-docker.pkg.dev/budget-app-prod/budget-app/api   │
│                                                                              │
│  # Deploy to Cloud Run                                                      │
│  $ gcloud run deploy budget-api \                                           │
│      --image europe-central2-docker.pkg.dev/budget-app-prod/budget-app/api \
│      --platform managed \                                                   │
│      --region europe-central2 \                                             │
│      --allow-unauthenticated \                                              │
│      --service-account budget-api-runtime@budget-app-prod.iam.gserviceaccount.com \
│      --set-env-vars "ASPNETCORE_ENVIRONMENT=Production"                     │
│                                                                              │
│  📝 Note the Service URL:                                                   │
│     https://budget-api-xxxxx-ey.a.run.app                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.3: Manual First Deploy - Frontend                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal                                                          │
│                                                                              │
│  # Update .env.production with real API URL                                 │
│  $ cd src/web                                                               │
│  $ cat > .env.production << 'EOF'                                           │
│  VITE_API_URL=https://budget-api-xxxxx-ey.a.run.app                        │
│  VITE_FIREBASE_API_KEY=AIzaSy...                                            │
│  VITE_FIREBASE_AUTH_DOMAIN=budget-app-prod.firebaseapp.com                 │
│  VITE_FIREBASE_PROJECT_ID=budget-app-prod                                  │
│  # ... rest of Firebase config                                              │
│  EOF                                                                        │
│                                                                              │
│  # Build and deploy                                                         │
│  $ npm run build                                                            │
│  $ firebase deploy --only hosting                                           │
│                                                                              │
│  📝 Note the Hosting URL:                                                   │
│     https://budget-app-prod.web.app                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.4: Verify Deployment                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ☐ Open https://budget-app-prod.web.app                                    │
│  ☐ Click "Sign in with Google"                                             │
│  ☐ Verify you can log in                                                   │
│  ☐ Check browser console for errors                                        │
│  ☐ Check Cloud Run logs in GCP Console                                     │
│                                                                              │
│  🎉 Congratulations! Your app is live!                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Automate with GitHub Actions (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.1: Commit Workflow Files                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Git                                                               │
│                                                                              │
│  The workflow files should already be in .github/workflows/                 │
│  (created as part of repository structure)                                  │
│                                                                              │
│  $ git add .                                                                │
│  $ git commit -m "chore: add CI/CD workflows"                              │
│  $ git push origin main                                                     │
│                                                                              │
│  Watch the Actions tab - workflows should start running!                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.2: Test the Pipeline                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ☐ Create a test branch:                                                    │
│    $ git checkout -b test/ci-pipeline                                      │
│    $ echo "# Test" >> README.md                                            │
│    $ git commit -am "test: verify CI pipeline"                             │
│    $ git push origin test/ci-pipeline                                      │
│                                                                              │
│  ☐ Open Pull Request on GitHub                                              │
│  ☐ Verify CI workflow runs and passes                                       │
│  ☐ Merge PR                                                                 │
│  ☐ Verify deploy workflows trigger on main                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 📋 Setup Checklist Summary

```
PHASE 0: Prerequisites
☐ Node.js 20+ installed
☐ .NET 8 SDK installed
☐ Docker Desktop installed
☐ gcloud CLI installed
☐ firebase CLI installed

PHASE 1: GitHub
☐ Repository created
☐ Branch protection configured (optional)

PHASE 2: Firebase Console
☐ Project created
☐ Blaze plan enabled
☐ Budget alerts set up
☐ Authentication enabled (Email + Google)
☐ Firestore database created
☐ Web app registered
☐ Firebase config saved
☐ firebase init completed locally

PHASE 3: GCP Console
☐ APIs enabled (Cloud Run, Build, Artifact Registry, etc.)
☐ Artifact Registry repository created
☐ Cloud Storage bucket created
☐ Runtime service account created
☐ Workload Identity Federation configured
☐ Deployer service account created

PHASE 4: GitHub Secrets
☐ All secrets added to repository
☐ Production environment configured (optional)

PHASE 5: Local Development
☐ Dependencies installed
☐ Local env files created
☐ Emulators running
☐ App accessible at localhost:5173

PHASE 6: First Deployment
☐ Firestore rules deployed
☐ Backend deployed to Cloud Run
☐ Frontend deployed to Firebase Hosting
☐ End-to-end verification passed

PHASE 7: CI/CD
☐ Workflow files committed
☐ Pipeline tested with PR
☐ Automated deployments working
```

---

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections inherit user scope
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // System categories are read-only for all authenticated users
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only, via service account
    }
  }
}
```

---

## Appendix B: Environment Variables

### Backend (Cloud Run)

```bash
# GCP (auto-injected in Cloud Run)
GOOGLE_CLOUD_PROJECT=budget-app-prod
GCS_BUCKET_NAME=budget-app-uploads

# Firebase Admin SDK uses Application Default Credentials
# No explicit config needed when running on GCP

# App
ASPNETCORE_ENVIRONMENT=Production
```

### Frontend (Build-time)

```bash
VITE_API_URL=https://api.budget.example.com
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=budget-app-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=budget-app-prod
VITE_FIREBASE_STORAGE_BUCKET=budget-app-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Appendix C: Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/your-username/budget-app.git
cd budget-app

# Start local emulators
docker-compose up -d

# Backend (new terminal)
cd src/api/BudgetApp.Api
dotnet restore
dotnet run

# Frontend (new terminal)
cd src/web
npm install
npm run dev

# Open http://localhost:5173
```

---

*Document maintained by: Architecture Team*  
*Last updated: January 27, 2026*

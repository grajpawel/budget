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
    - Platform Overview (GitHub, AWS)
    - AWS Console Navigation
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
│  │                    Hosted on: AWS Amplify Hosting                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  Cognito    │  │  Dashboard  │  │ Transactions│  │   Upload     │  │  │
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
│                              API LAYER                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              AWS API Gateway (HTTP API)                                │  │
│  │              Routes: /api/* → Lambda                                   │  │
│  │              Auth: Cognito JWT Authorizer                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                           BACKEND-FOR-FRONTEND (BFF)                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              AWS Lambda (.NET 8 Native AOT)                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Auth      │  │   Upload    │  │ Transaction │  │   Dashboard  │  │  │
│  │  │ Middleware  │  │   Handler   │  │   Handler   │  │   Handler    │  │  │
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
│   OBJECT STORAGE     │                │           DATABASE                    │
│  ┌────────────────┐  │                │  ┌────────────────────────────────┐  │
│  │   Amazon S3    │  │                │  │     DynamoDB (NoSQL)           │  │
│  │                │  │                │  │     25 GB Free Tier! 🎉        │  │
│  │ • Raw uploads  │  │                │  │  ┌────────────────────────────┐│  │
│  │ • Processed    │  │                │  │  │ Single-Table Design:       ││  │
│  │   archives     │  │                │  │  │ PK: USER#<id>              ││  │
│  │                │  │                │  │  │ SK: PROFILE | TXN# | CAT#  ││  │
│  └────────────────┘  │                │  │  └────────────────────────────┘│  │
│                      │                │  └────────────────────────────────┘  │
└──────────────────────┘                └──────────────────────────────────────┘
          │                                         │
          └─────────────────────┬───────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │     AWS COGNITO       │
                    │  (Identity Provider)  │
                    │  • User Pools         │
                    │  • Google/Email/OAuth │
                    │  • JWT Access Tokens  │
                    │  • 50K MAU Free       │
                    └───────────────────────┘
```

### 1.2 BFF Pattern Explanation

The **Backend-For-Frontend (BFF)** pattern is central to this architecture:

```
┌──────────────┐         ┌─────────────────┐         ┌────────────────┐
│   React SPA  │ ──────► │   BFF (.NET)    │ ──────► │   Data Stores  │
│              │         │                 │         │                │
│ • UI Logic   │         │ • Auth Verify   │         │ • DynamoDB     │
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
2. Amplify Auth SDK redirects to Cognito Hosted UI (or embedded)
3. User authenticates (Google, email/password, etc.)
4. Cognito issues JWT tokens (ID token, access token, refresh token)
5. React stores tokens, attaches access token to API requests as Bearer token
6. API Gateway validates JWT via Cognito authorizer (built-in)
7. Lambda extracts user_id (Cognito sub claim), scopes all queries to that user
```

#### File Upload Flow
```
1. User selects CSV file in React upload component
2. React sends multipart/form-data to POST /api/imports (via API Gateway)
3. API Gateway validates JWT, routes to Lambda
4. Lambda stores raw file in S3 (user-scoped path: uploads/{userId}/)
5. Lambda detects file type, selects appropriate parser
6. Parser extracts transactions, normalizes to common model
7. Categorization engine assigns categories
8. Transactions saved to DynamoDB with user_id (PK)
9. Import metadata saved (file name, count, status)
10. Response returned to React with import summary
```

#### Dashboard Load Flow
```
1. React loads dashboard component
2. Parallel API calls:
   - GET /api/dashboard/summary?period=month
   - GET /api/transactions?limit=10&sort=date:desc
3. API Gateway validates JWT on each request via Cognito authorizer
4. Lambda queries DynamoDB with PK=USER#{userId}
5. Lambda aggregates data (totals, category breakdowns)
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
| **Auth (Frontend)** | AWS Amplify Auth | 6.x | Cognito integration, React hooks |
| **Backend** | ASP.NET Core | 8.0 | Familiar, performant, Native AOT for Lambda |
| **Backend Runtime** | AWS Lambda | .NET 8 | Serverless, 1M requests/month free |
| **API Gateway** | AWS API Gateway | HTTP API | Low cost, JWT auth, $1/million requests |
| **Database** | DynamoDB | - | 25 GB free tier, serverless, single-table design |
| **File Storage** | Amazon S3 | - | 5 GB free tier (12 months), integrates with Lambda |
| **Hosting (SPA)** | AWS Amplify Hosting | - | 5 GB storage, 15 GB/month bandwidth free |
| **CI/CD** | GitHub Actions + CodePipeline | - | Free tier GitHub, can offload to AWS CodePipeline |
| **IaC** | AWS CDK | TypeScript | Type-safe, excellent .NET support |

### 2.2 Detailed Justifications

#### Frontend: React + Vite + TypeScript

**Why React over alternatives:**
- You're experienced with it (productivity matters)
- Largest ecosystem for charting, forms, auth integrations
- AWS Amplify has excellent React integration via hooks
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

#### Backend: ASP.NET Core 8 on Lambda

**Why .NET over Node.js or Go:**
- Your preferred stack (faster development)
- Excellent performance with Native AOT compilation (~1s cold starts)
- Strong typing pairs well with TypeScript frontend
- Mature libraries for file parsing (CSV, HTML, PDF)
- AWS SDK for .NET is comprehensive

**Key packages:**
```xml
<PackageReference Include="AWSSDK.DynamoDBv2" Version="3.*" />
<PackageReference Include="AWSSDK.S3" Version="3.*" />
<PackageReference Include="Amazon.Lambda.AspNetCoreServer.Hosting" Version="1.*" />
<PackageReference Include="Amazon.Lambda.RuntimeSupport" Version="1.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.*" />
<PackageReference Include="CsvHelper" Version="30.*" />
<PackageReference Include="HtmlAgilityPack" Version="1.*" />
```

#### Database: DynamoDB

| Factor | DynamoDB | RDS (PostgreSQL) |
|--------|----------|------------------|
| **Free Tier** | 25 GB storage, 25 RCU/WCU | None (always costs ~$15+/month) |
| **Operational Overhead** | Zero | Backups, updates, connections |
| **Scaling** | Automatic (on-demand mode) | Manual |
| **Cold Starts** | None | Connection pool issues |
| **Complex Queries** | Limited (use GSIs) | Full SQL |
| **Schema Flexibility** | Great (schemaless) | Requires migrations |

**Decision: DynamoDB** — The 25 GB free tier is incredibly generous (25x Firestore's 1 GB). For a personal budget app with user-scoped access patterns, DynamoDB with single-table design is perfect. Uses partition key USER#{userId} for data isolation.

#### File Storage: Amazon S3

- 5 GB free tier for 12 months (plenty for transaction files)
- Integrates seamlessly with Lambda (same AWS account)
- Presigned URLs for secure uploads if needed
- Lifecycle policies to archive/delete old files
- After free tier: ~$0.023/GB/month (very cheap)

#### Hosting: Lambda + API Gateway + Amplify Hosting

**Lambda + API Gateway for API:**
- Lambda: 1 million requests/month free, 400K GB-seconds
- API Gateway HTTP API: $1/million requests (very cheap)
- Auto-scales instantly
- Native AOT reduces cold starts to ~1 second
- Pay only for what you use

**Amplify Hosting for SPA:**
- 5 GB storage free
- 15 GB/month bandwidth free
- Global CDN (CloudFront)
- Automatic builds from GitHub
- Preview deployments for PRs

#### Authentication: AWS Cognito

| Factor | Cognito | Auth0 |
|--------|---------|-------|
| **Free Tier** | 50,000 MAU | 7,500 MAU |
| **AWS Integration** | Native (IAM, API Gateway) | Requires custom JWT validation |
| **Cost at Scale** | $0.0055/MAU after 50K | Expensive tiers |
| **Hosted UI** | Functional, customizable | Polished |
| **Social Login** | Google, Facebook, Apple, SAML | Extensive providers |
| **Setup Complexity** | Medium | Easy |

**Decision: AWS Cognito** — 50K MAU free is more than enough for personal use. Native integration with API Gateway for JWT validation (zero code needed). Keeps everything in one AWS account.

### 2.3 Cost Optimization Design Principles

1. **Serverless-first**: Lambda + DynamoDB = pay only for usage
2. **Generous free tiers**: DynamoDB 25 GB, Lambda 1M requests, Cognito 50K MAU
3. **Single AWS account**: All services in one account, no cross-account costs
4. **Efficient data model**: DynamoDB single-table design minimizes operations
5. **Client-side caching**: TanStack Query reduces API calls
6. **Static asset hosting**: SPA served from CloudFront CDN
7. **Native AOT compilation**: Reduces Lambda cold starts and execution time

---

## 3. Data Model

### 3.1 DynamoDB Single-Table Design

DynamoDB uses a **single-table design** pattern where all entities are stored in one table. This differs from traditional relational databases or document databases like Firestore.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DYNAMODB TABLE: BudgetApp                            │
│               (Cognito manages identity, DynamoDB stores data)          │
├──────────────────┬────────────────────┬─────────────────────────────────┤
│ PK (Partition Key) │ SK (Sort Key)      │ Attributes                      │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ USER PROFILE                    │
│ USER#abc123      │ PROFILE            │ email, displayName, currency,   │
│                  │                    │ settings, createdAt, lastLogin  │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ TRANSACTIONS (sorted by date)   │
│ USER#abc123      │ TXN#2025-01-15#001 │ amount, description, category,  │
│ USER#abc123      │ TXN#2025-01-15#002 │ currency, merchant, importId,   │
│ USER#abc123      │ TXN#2025-01-14#001 │ categorySource, tags, hash...   │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ IMPORTS                         │
│ USER#abc123      │ IMPORT#imp001      │ fileName, fileType, s3Path,     │
│ USER#abc123      │ IMPORT#imp002      │ status, transactionCount, ...   │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ USER CATEGORIES                 │
│ USER#abc123      │ CAT#cat_groceries  │ name, icon, color, type,        │
│ USER#abc123      │ CAT#cat_transport  │ parentId, budget, sortOrder     │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ CATEGORIZATION RULES            │
│ USER#abc123      │ RULE#rule001       │ categoryId, matchType, match-   │
│ USER#abc123      │ RULE#rule002       │ Field, matchValue, priority...  │
├──────────────────┼────────────────────┼─────────────────────────────────┤
│                  │                    │ SYSTEM CATEGORIES (shared)      │
│ SYSTEM           │ CAT#cat_groceries  │ name, icon, color, isSystem=1   │
│ SYSTEM           │ CAT#cat_salary     │ (Read-only, copied to user)     │
└──────────────────┴────────────────────┴─────────────────────────────────┘
```

**Access Patterns:**

| Access Pattern | Query |
|----------------|-------|
| Get user profile | PK = "USER#abc123", SK = "PROFILE" |
| Get all transactions | PK = "USER#abc123", SK begins_with "TXN#" |
| Get transactions for month | PK = "USER#abc123", SK between "TXN#2025-01" and "TXN#2025-02" |
| Get all categories | PK = "USER#abc123", SK begins_with "CAT#" |
| Get all imports | PK = "USER#abc123", SK begins_with "IMPORT#" |
| Get all rules | PK = "USER#abc123", SK begins_with "RULE#" |
| Get system categories | PK = "SYSTEM", SK begins_with "CAT#" |

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

### 3.3 DynamoDB GSI Strategy

Global Secondary Indexes (GSIs) for additional access patterns:

```
Table: BudgetApp
Primary Key: PK (Partition Key), SK (Sort Key)

GSI1: Category-based queries
├── GSI1PK: USER#{userId}#CATEGORY#{categoryId}
├── GSI1SK: TXN#{date}#{id}
└── Use: Get all transactions for a specific category

GSI2: Import-based queries  
├── GSI2PK: USER#{userId}#IMPORT#{importId}
├── GSI2SK: TXN#{date}#{id}
└── Use: Get all transactions from a specific import

GSI3: Monthly aggregation (optional, for large datasets)
├── GSI3PK: USER#{userId}#MONTH#{yyyy-MM}
├── GSI3SK: TXN#{date}#{id}
└── Use: Get all transactions for a specific month quickly
```

**Note:** Start with just the base table (PK/SK). Add GSIs only when query patterns demand it — each GSI adds storage and write costs.

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
│  │  Batch write to DynamoDB (max 25 items per BatchWriteItem)          ││
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
│  │  • Amazon SageMaker Autopilot (AWS) - for advanced users            ││
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

Authentication: Bearer token (Cognito JWT Access Token)
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
│    "id": "cognito_sub_abc123",                                          │
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
│  │  Database: DynamoDB Local (localhost:8000)                          ││
│  │  Storage:  LocalStack S3 (localhost:4566)                           ││
│  │  Auth:     Mock JWT / Cognito (use test accounts)                   ││
│  │                                                                      ││
│  │  docker-compose.yml for local AWS services                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    │ git push                            │
│                                    ▼                                     │
│  STAGING (Optional - same account, different resources)                 │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  URL: https://staging.budget.example.com                            ││
│  │  Triggered by: Push to 'develop' branch                             ││
│  │  Data: Separate DynamoDB table (BudgetApp-staging)                  ││
│  │  Auth: Cognito (same user pool, use test accounts)                  ││
│  │  Purpose: Integration testing before production                     ││
│  │                                                                      ││
│  │  Note: Can skip staging initially to save costs                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    │ PR merge to main                    │
│                                    ▼                                     │
│  PRODUCTION                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Frontend: https://budget.example.com (Amplify Hosting)             ││
│  │  Backend:  https://api.budget.example.com (API Gateway + Lambda)    ││
│  │  Database: DynamoDB (production table)                              ││
│  │  Storage:  S3 (production bucket)                                   ││
│  │  Auth:     Cognito (production user pool)                           ││
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
│       ├── ci.yml              # Build & test on all PRs
│       ├── deploy-api.yml      # Deploy backend to Lambda (or offload to CodePipeline)
│       └── deploy-web.yml      # Deploy frontend to Amplify
├── src/
│   ├── api/                    # ASP.NET Core Lambda project
│   │   ├── BudgetApp.Api/
│   │   ├── BudgetApp.Core/
│   │   ├── BudgetApp.Infrastructure/
│   │   ├── BudgetApp.Tests/
│   │   └── BudgetApp.sln
│   └── web/                    # React project
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── infra/                      # AWS CDK (TypeScript)
│   ├── lib/
│   │   ├── budget-app-stack.ts
│   │   ├── api-stack.ts
│   │   ├── database-stack.ts
│   │   └── auth-stack.ts
│   ├── bin/
│   │   └── budget-app.ts
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── ARCHITECTURE.md         # This document
├── docker-compose.yml          # Local AWS emulators (DynamoDB, LocalStack)
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
      - 'infra/**'

env:
  AWS_REGION: eu-central-1

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # For AWS OIDC authentication
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      # Authenticate to AWS via OIDC (no stored secrets!)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      # Build .NET Lambda with Native AOT
      - name: Build Lambda
        working-directory: src/api
        run: |
          dotnet publish BudgetApp.Api -c Release -r linux-x64 --self-contained
      
      # Deploy via CDK
      - name: Deploy CDK Stack
        working-directory: infra
        run: |
          npm ci
          npx cdk deploy BudgetAppApiStack --require-approval never
```

**Alternative: Offload to AWS CodePipeline**

For more complex deployments or if you want to reduce GitHub Actions usage:

```yaml
# deploy-api-trigger.yml - Just triggers CodePipeline
name: Trigger AWS Deploy

on:
  push:
    branches: [main]
    paths:
      - 'src/api/**'

jobs:
  trigger:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: eu-central-1
      
      - name: Trigger CodePipeline
        run: |
          aws codepipeline start-pipeline-execution --name budget-app-api-pipeline
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
    permissions:
      id-token: write
      contents: read
    
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
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_COGNITO_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
          VITE_COGNITO_CLIENT_ID: ${{ secrets.COGNITO_CLIENT_ID }}
          VITE_COGNITO_DOMAIN: ${{ secrets.COGNITO_DOMAIN }}
          VITE_AWS_REGION: eu-central-1
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: eu-central-1
      
      # Option 1: Deploy via Amplify CLI
      - name: Deploy to Amplify
        run: |
          npm install -g @aws-amplify/cli
          amplify publish --yes
      
      # Option 2: Deploy via S3 + CloudFront (manual Amplify bypass)
      # - name: Deploy to S3
      #   run: aws s3 sync dist/ s3://budget-app-frontend --delete
      # - name: Invalidate CloudFront
      #   run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DIST_ID }} --paths "/*"
```

**Note:** AWS Amplify Hosting has built-in GitHub integration. You can skip the GitHub Actions workflow entirely and configure Amplify to auto-deploy on push to main. This is simpler and uses AWS resources instead of GitHub Actions minutes.

### 7.4 Local Development Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
  
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"   # LocalStack gateway (S3, etc.)
    environment:
      - SERVICES=s3
      - DEBUG=1
    volumes:
      - "./localstack-data:/var/lib/localstack"
```

**Developer workflow:**
```bash
# Terminal 1: Start local AWS services
docker-compose up

# Terminal 2: Seed DynamoDB table
aws dynamodb create-table --endpoint-url http://localhost:8000 \
  --table-name BudgetApp \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Terminal 3: Start backend
cd src/api/BudgetApp.Api
DYNAMODB_LOCAL=http://localhost:8000 dotnet watch run

# Terminal 4: Start frontend
cd src/web
npm run dev
```

**Environment variables for local development:**
```bash
# src/api/BudgetApp.Api/appsettings.Development.json
{
  "AWS": {
    "DynamoDB": {
      "ServiceURL": "http://localhost:8000"
    },
    "S3": {
      "ServiceURL": "http://localhost:4566"
    }
  }
}
```

---

## 8. Cost Breakdown

### 8.1 Free Tier Limits (AWS)

| Service | Free Tier | Limit Type |
|---------|-----------|------------|
| **Lambda** | 1M requests/month | Monthly |
| **Lambda** | 400,000 GB-seconds | Monthly |
| **API Gateway (HTTP)** | 1M requests/month | 12 months |
| **DynamoDB** | 25 GB storage | Forever |
| **DynamoDB** | 25 WCU | Forever |
| **DynamoDB** | 25 RCU | Forever |
| **DynamoDB (On-Demand)** | 2.5M reads/month | 12 months |
| **DynamoDB (On-Demand)** | 1M writes/month | 12 months |
| **S3** | 5 GB storage | 12 months |
| **S3** | 20,000 GET requests/month | 12 months |
| **S3** | 2,000 PUT requests/month | 12 months |
| **Amplify Hosting** | 5 GB storage | Forever |
| **Amplify Hosting** | 15 GB transfer/month | Forever |
| **Amplify Build** | 1,000 build minutes/month | Forever |
| **Cognito** | 50,000 MAU | Forever |
| **CloudWatch** | 10 custom metrics | Forever |
| **CloudWatch** | 5 GB log ingestion | Forever |
| **GitHub Actions** | 2,000 mins/month (private) | Monthly |

**Key AWS Advantage:** DynamoDB's 25 GB free forever storage easily accommodates years of personal transaction data.

### 8.2 Usage Estimation

#### Scenario: 1 Personal User

```
Daily usage estimate:
- Dashboard loads: 5
- Transaction list views: 10
- File imports: 0.1 (3/month)

DynamoDB reads per day (RCU = 4KB per strongly consistent read):
- Dashboard summary: 1 Query = ~5 RCU
- Transaction list: ~10 Queries × 5 = 50 RCU
- Category/rule lookups: ~20 RCU
Total: ~75 RCU/day → 2,250/month (0.09% of 2.5M free tier)

DynamoDB writes per day (WCU = 1KB per write):
- Transaction creates: ~5
- Profile/rule updates: ~3
Total: ~8 WCU/day → 240/month (0.024% of 1M free tier)

Lambda:
- API calls: ~50/day → 1,500/month (0.15% of 1M free tier)
- Compute: ~100ms avg × 256MB = negligible GB-seconds

MONTHLY COST: $0.00
```

#### Scenario: 10 Active Users

```
DynamoDB reads: 750 RCU/day → 22,500/month (0.9% of free tier)
DynamoDB writes: 80 WCU/day → 2,400/month (0.24% of free tier)
Lambda: 15,000 requests/month (1.5% of free tier)
Storage: ~100 MB DynamoDB, ~50 MB S3 (negligible)

MONTHLY COST: $0.00
```

#### Scenario: 100 Active Users

```
DynamoDB reads: 7,500 RCU/day → 225,000/month (9% of free tier)
DynamoDB writes: 800 WCU/day → 24,000/month (2.4% of free tier)
Lambda: 150,000 requests/month (15% of free tier)
DynamoDB storage: ~500 MB (2% of 25 GB free tier)
S3 storage: ~200 MB (4% of 5 GB free tier)

MONTHLY COST: $0.00
```

#### Scenario: 1,000 Active Users (Growth Projection)

```
DynamoDB reads: 2.25M/month (90% of free tier)
DynamoDB writes: 240,000/month (24% of free tier)
Lambda: 1.5M requests/month (slight overage)
DynamoDB storage: ~5 GB (20% of 25 GB free tier)

MONTHLY COST: ~$0.50 - $2.00 (mostly Lambda overage)
```

### 8.3 Cost Optimization Strategies

1. **Aggressive caching** (TanStack Query)
   - Dashboard data cached for 5 minutes
   - Category list cached indefinitely (invalidate on change)
   - Reduces DynamoDB reads by 60-80%

2. **Efficient DynamoDB queries**
   - Single-table design minimizes requests
   - Use Query over Scan (always use partition key)
   - Project only needed attributes with ProjectionExpression
   - Use sparse GSIs for filtered views

3. **Pagination over full loads**
   - Use DynamoDB pagination with LastEvaluatedKey
   - Never load all transactions at once
   - Lazy load older data with infinite scroll

4. **Aggregation at write time**
   - Store monthly summaries as items (SK=SUMMARY#2024-01)
   - Update atomically with UpdateExpression
   - Trades write cost for read savings

5. **Lambda cold start optimization**
   - .NET 8 Native AOT for <100ms cold starts
   - Minimal function package size
   - Consider Provisioned Concurrency only if needed (not free)

6. **On-Demand vs Provisioned capacity**
   - Start with On-Demand (pay-per-request)
   - Switch to Provisioned (25 RCU/WCU free) for predictable workloads

### 8.4 Cost Alerts

Set up AWS Budgets:
- Warning at $1/month
- Critical at $5/month
- Auto-stop resources at $10/month (via Lambda)

```bash
# Create a budget via AWS CLI
aws budgets create-budget \
  --account-id <YOUR_ACCOUNT_ID> \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## 9. Implementation Roadmap

### Phase 1: MVP (4-6 weeks)

**Goal:** Working end-to-end flow for single user

```
Week 1-2: Foundation
├── ☐ Set up GitHub repository with CI/CD skeleton
├── ☐ Create AWS account, set up IAM user/roles
├── ☐ Initialize AWS CDK project (TypeScript)
├── ☐ Configure Cognito User Pool (enable Google, email/password)
├── ☐ Initialize React project (Vite + TypeScript)
├── ☐ Initialize ASP.NET Core Lambda project
├── ☐ Configure Amplify Auth integration (frontend)
├── ☐ Set up DynamoDB Local for local dev
└── ☐ Implement basic user profile flow

Week 3-4: Core Import Flow
├── ☐ Design and implement data models (DynamoDB single-table)
├── ☐ Build file upload API endpoint (S3 presigned URLs)
├── ☐ Implement generic CSV parser
├── ☐ Implement one bank-specific parser (mBank CSV)
├── ☐ Build transaction normalization pipeline
├── ☐ Implement basic rule-based categorization
├── ☐ Create default category seed data
└── ☐ Build simple upload UI component

Week 5-6: Dashboard & Deployment
├── ☐ Implement transaction list API (with DynamoDB pagination)
├── ☐ Implement dashboard summary API
├── ☐ Build transaction list UI with filtering
├── ☐ Build dashboard with summary cards
├── ☐ Add one chart (monthly expenses bar chart)
├── ☐ Deploy Lambda via CDK + API Gateway
├── ☐ Deploy frontend to Amplify Hosting
├── ☐ Set up custom domain (optional)
└── ☐ End-to-end testing

MVP Deliverables:
✓ User can log in with Cognito (Google or email/password)
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
| **DynamoDB query constraints** | Must know partition key; no ad-hoc queries | Design access patterns upfront; use GSIs for alternate access |
| **DynamoDB no full-text search** | Transaction search is basic | Use OpenSearch (complex) or client-side filtering for small datasets |
| **Cognito customization limits** | Limited email template/UI customization | Use hosted UI; customize Lambda triggers for advanced flows |
| **Lambda cold starts** | First request may be slow (~500ms-2s with AOT) | Native AOT compilation; Provisioned Concurrency if needed |
| **Single region** | Higher latency for global users | Use CloudFront for frontend; backend latency acceptable for non-realtime app |
| **No offline support** | Requires internet connection | PWA with service worker caching for read-only dashboard (future) |

### 10.2 Technical Debt Risks

| Risk | Likelihood | Impact | Prevention Strategy |
|------|------------|--------|---------------------|
| **Parser complexity explosion** | Medium | High | Strong interface contracts; one parser per bank; don't over-generalize |
| **Category model changes** | Low | Medium | Avoid breaking changes; use soft deletes; version categories if needed |
| **Cognito vendor lock-in** | Low | Low | Standard JWT/OIDC; can migrate to Auth0 if needed |
| **DynamoDB schema changes** | Medium | High | Single-table design upfront; use versioned item types; backwards-compatible changes |

### 10.3 What Might Need Refactoring Later

1. **Move to SQL if queries get complex**
   - Sign: DynamoDB access patterns insufficient, need complex joins
   - Solution: Migrate to Aurora Serverless v2 (PostgreSQL)
   - Effort: 2-3 weeks

2. **Split Lambda into microservices**
   - Sign: Single Lambda becomes >10K lines, cold starts increase
   - Solution: Extract parser Lambda, analytics Lambda
   - Effort: 4-6 weeks

3. **Add message queue for imports**
   - Sign: Large file imports timeout, need for retries
   - Solution: SQS + separate processing Lambda for async
   - Effort: 1-2 weeks

4. **Replace ML.NET with cloud ML**
   - Sign: Model training too slow, need for GPU
   - Solution: SageMaker Autopilot or custom model on Lambda
   - Effort: 2-4 weeks

### 10.4 Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Multi-tenant data isolation** | Every DynamoDB query includes `userId` in partition key; Lambda validates JWT claims |
| **File upload attacks** | Validate file size, type, and content before processing; S3 virus scanning (optional) |
| **JWT security** | Validate signature, issuer, audience; use Cognito JWT Authorizer; short expiry; refresh token rotation |
| **Sensitive data in logs** | Never log transaction descriptions or amounts; structured logging |
| **CORS** | Strict origin whitelist in API Gateway; no wildcards in production |
| **Rate limiting** | API Gateway throttling (10K req/sec default); use Usage Plans for stricter limits |

### 10.5 Decision Log

| Decision | Alternatives Considered | Rationale |
|----------|------------------------|-----------|
| **DynamoDB over PostgreSQL** | Aurora, RDS, Supabase | 25 GB free forever, serverless, sufficient for app needs |
| **Cognito over Auth0** | Auth0, Firebase Auth | 50K MAU free, native AWS integration, simpler architecture |
| **Lambda over ECS/Fargate** | ECS Fargate, App Runner | Better free tier, event-driven, Native AOT for fast cold starts |
| **React over Vue/Svelte** | Vue 3, SvelteKit | Team expertise, larger ecosystem |
| **REST over GraphQL** | GraphQL, gRPC | Simpler, sufficient for needs, less overhead |
| **Vite over Next.js** | Next.js, Create React App | SPA is sufficient; no SSR needed; faster DX |
| **AWS CDK over Terraform** | Terraform, SAM | TypeScript consistency, better DynamoDB/Lambda constructs |

---

## 11. Additional Considerations

### 11.1 Testing Strategy

| Layer | Testing Approach | Tools |
|-------|-----------------|-------|
| **Frontend Unit** | Component testing, hook testing | Vitest, React Testing Library |
| **Frontend E2E** | Critical user flows | Playwright (free, fast) |
| **Backend Unit** | Service/parser logic | xUnit, Moq |
| **Backend Integration** | API endpoints with local DynamoDB | WebApplicationFactory, DynamoDB Local |
| **Contract Testing** | API schema validation | Optional: Pact or OpenAPI validation |

**Recommended test coverage targets:**
- Parsers: 90%+ (critical path)
- Categorization engine: 80%+
- API controllers: 70%+
- Frontend components: 60%+

### 11.2 Observability & Monitoring

**Logging (Free):**
- Lambda logs automatically sent to CloudWatch Logs
- Structured logging with correlation IDs (X-Ray trace ID)
- Log-based alerting via CloudWatch Alarms

**Metrics (Free tier):**
- Lambda built-in metrics (invocations, duration, errors)
- API Gateway metrics (request count, latency, 4xx/5xx)
- DynamoDB metrics (consumed capacity, throttled requests)
- 10 custom CloudWatch metrics free

**Error Tracking (Recommended):**
- **Sentry** (free tier: 5K errors/month) - excellent for both frontend and backend
- Alternative: AWS X-Ray (free tier: 100K traces/month)

**Alerting:**
- Set up CloudWatch Alarms for: error rate spikes, high latency, throttling
- SNS notifications for alerts (free tier: 1M publishes)

### 11.3 Data Backup & Recovery

**DynamoDB:**
- Enable Point-in-Time Recovery (PITR) - 35 days retention (costs ~$0.20/GB/month)
- Or: On-demand backups to S3 (free, but manual restore)
- Recommendation: Start with on-demand backups, add PITR if data grows

**S3 (uploaded files):**
- Enable versioning for accidental delete protection
- Set lifecycle rule: delete non-current versions after 30 days

**Backup script example (EventBridge + Lambda):**
```
Daily at 2 AM: DynamoDB on-demand backup
Weekly: Export to S3 (DynamoDB Export to S3 feature)
Monthly: Archive to S3 Glacier
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
| **API Response (p95)** | <500ms | CloudWatch metrics |
| **Lambda Cold Start** | <1s (AOT) | Lambda metrics |

**Strategies to achieve:**
- Code splitting by route (React.lazy)
- Image optimization (if applicable)
- TanStack Query caching
- .NET 8 Native AOT for sub-second cold starts
- Consider Provisioned Concurrency for zero cold starts (not free)

### 11.7 GDPR & Privacy Considerations

| Requirement | Implementation |
|-------------|----------------|
| **Data Export** | API endpoint to export all user data as JSON |
| **Data Deletion** | API endpoint to delete user and all related DynamoDB items |
| **Consent** | Privacy policy acceptance on signup |
| **Data Minimization** | Don't store unnecessary PII |
| **Encryption** | AWS encrypts at rest by default; TLS for transit |

**User data deletion flow:**
1. User requests deletion via UI
2. API soft-deletes user (sets `deletedAt` attribute)
3. EventBridge scheduled rule + Lambda permanently deletes after 30 days
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
│   │   ├── deploy-api.yml            # Deploy backend Lambda via CDK
│   │   ├── deploy-web.yml            # Deploy frontend (Amplify auto-deploys)
│   │   └── deploy-infra.yml          # Apply CDK changes
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
│   │   ├── 📁 BudgetApp.Infrastructure/  # External concerns (DynamoDB, S3)
│   │   │   ├── DynamoDB/
│   │   │   ├── Storage/
│   │   │   ├── Parsing/
│   │   │   └── BudgetApp.Infrastructure.csproj
│   │   │
│   │   ├── 📁 BudgetApp.Tests/       # Unit + integration tests
│   │   │   ├── Unit/
│   │   │   ├── Integration/
│   │   │   └── BudgetApp.Tests.csproj
│   │   │
│   │   ├── Dockerfile                # For local development (optional)
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
│       │   ├── 📁 lib/               # Utilities, API client, AWS config
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
│       └── tailwind.config.js
│
├── 📁 infra/                         # Infrastructure as Code (AWS CDK)
│   ├── 📁 lib/                       # CDK Stack definitions
│   │   ├── budget-app-stack.ts      # Main stack (Lambda, API GW, DynamoDB)
│   │   ├── auth-stack.ts            # Cognito User Pool
│   │   └── storage-stack.ts         # S3 bucket
│   ├── 📁 bin/
│   │   └── app.ts                    # CDK app entry point
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
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
│   ├── seed-categories.js            # Seed default categories to DynamoDB
│   └── backup-dynamodb.sh            # Manual backup script
│
├── docker-compose.yml                # Local development (DynamoDB Local, LocalStack)
├── docker-compose.override.yml       # Local overrides (gitignored)
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE
```

### 12.3 Infrastructure as Code Strategy

**Decision: AWS CDK (TypeScript)**

| Resource | Tool | Reason |
|----------|------|--------|
| **Cognito User Pool** | CDK | Full programmatic control, TypeScript consistency |
| **Lambda Functions** | CDK | Native .NET support, environment config |
| **API Gateway** | CDK | JWT authorizer integration with Cognito |
| **DynamoDB** | CDK | Table + GSI definition, IAM policies |
| **S3 Bucket** | CDK | Lifecycle rules, CORS config |
| **Amplify Hosting** | Console/CLI | GitHub integration simpler via UI |

#### CDK State Management

CDK uses CloudFormation under the hood. No separate state bucket needed - state is managed by CloudFormation.

**Bootstrap (one-time per account/region):**
```bash
# Bootstrap CDK before first deploy
cdk bootstrap aws://ACCOUNT_ID/eu-central-1
```

---

## 13. Platform Setup Guide

### 13.1 Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORMS TO CONFIGURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────┐     │
│  │     GITHUB      │    │              AMAZON WEB SERVICES             │     │
│  │                 │    │                                               │     │
│  │ • Repository    │    │ • IAM (Users, Roles, OIDC Provider)          │     │
│  │ • Actions       │    │ • Cognito (User Pool, App Client)            │     │
│  │ • Secrets       │    │ • DynamoDB (Single Table)                    │     │
│  │ • Environments  │    │ • S3 (Uploads Bucket)                        │     │
│  │                 │    │ • Lambda (API Functions)                     │     │
│  │                 │    │ • API Gateway (HTTP API)                     │     │
│  │                 │    │ • Amplify Hosting (Frontend)                 │     │
│  │                 │    │ • CloudWatch (Logs & Metrics)                │     │
│  └─────────────────┘    └─────────────────────────────────────────────┘     │
│          │                                    │                              │
│          │                                    │                              │
│          └────────────────────────────────────┘                              │
│                           │                                                  │
│              GitHub OIDC → IAM Role (no stored credentials)                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 AWS Console Organization

| Service | Purpose | Key Actions |
|---------|---------|-------------|
| **IAM** | Identity & Access | Create users, roles, OIDC provider for GitHub |
| **Cognito** | Authentication | Create User Pool, configure providers |
| **DynamoDB** | Database | Create table, configure GSIs |
| **S3** | File Storage | Create bucket, configure lifecycle |
| **Lambda** | Compute | Deploy API functions (via CDK) |
| **API Gateway** | API Management | Create HTTP API, JWT authorizer |
| **Amplify** | Frontend Hosting | Connect GitHub, auto-deploy |
| **CloudWatch** | Observability | View logs, set up alarms |
| **Budgets** | Cost Control | Set spending alerts |

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
│  ☐ AWS CLI v2: https://aws.amazon.com/cli/                                  │
│  ☐ AWS CDK: npm install -g aws-cdk                                          │
│  ☐ AWS Amplify CLI: npm install -g @aws-amplify/cli (optional)             │
│                                                                              │
│  Verify installations:                                                       │
│  $ node --version     # v20.x.x                                             │
│  $ dotnet --version   # 8.x.x                                               │
│  $ docker --version   # 24.x.x+                                             │
│  $ aws --version      # aws-cli/2.x.x                                       │
│  $ cdk --version      # 2.x.x                                               │
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

### Phase 2: AWS Account Setup (30 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.1: Create AWS Account (if needed)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: aws.amazon.com                                                    │
│                                                                              │
│  ☐ Go to aws.amazon.com → Create an AWS Account                             │
│  ☐ Provide email, password, account name                                    │
│  ☐ Add payment method (required, but free tier covers our usage)            │
│  ☐ Complete phone verification                                              │
│  ☐ Select "Basic Support - Free" plan                                      │
│                                                                              │
│  📝 Note your Account ID: _______________________                           │
│     (12-digit number, visible in top-right dropdown)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.2: Set Up Budget Alerts                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → Billing → Budgets                       │
│                                                                              │
│  ⚠️  Do this FIRST to avoid surprises!                                      │
│                                                                              │
│  ☐ Click "Create budget"                                                    │
│  ☐ Use template: "Zero spend budget" OR "Monthly cost budget"              │
│  ☐ Budget amount: $5 (or $10 for safety margin)                            │
│  ☐ Email notifications: your-email@example.com                              │
│  ☐ Alert thresholds: 50%, 80%, 100%                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2.3: Create IAM User for CLI Access                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → IAM → Users                             │
│                                                                              │
│  ☐ Click "Create user"                                                      │
│  ☐ Username: budget-app-admin                                              │
│  ☐ Select "Provide user access to AWS Management Console" (optional)       │
│  ☐ Attach policies directly:                                               │
│    • AdministratorAccess (for initial setup, can restrict later)           │
│  ☐ Create user                                                             │
│                                                                              │
│  ☐ Go to user → Security credentials → Create access key                   │
│  ☐ Use case: "Command Line Interface (CLI)"                               │
│  ☐ Download CSV or copy:                                                   │
│    📝 Access Key ID: _______________________                               │
│    📝 Secret Access Key: _______________________                           │
│                                                                              │
│  Configure CLI:                                                              │
│  $ aws configure                                                            │
│  AWS Access Key ID: [paste key]                                             │
│  AWS Secret Access Key: [paste secret]                                      │
│  Default region: eu-central-1                                               │
│  Default output format: json                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Cognito Setup (20 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.1: Create Cognito User Pool                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → Cognito → User pools                    │
│                                                                              │
│  ☐ Click "Create user pool"                                                │
│                                                                              │
│  Step 1 - Sign-in experience:                                               │
│  ☐ Cognito user pool sign-in options: Email                                │
│  ☐ User name requirements: Leave defaults                                  │
│                                                                              │
│  Step 2 - Security requirements:                                            │
│  ☐ Password policy: Cognito defaults (or customize)                       │
│  ☐ MFA: No MFA (can add later)                                            │
│  ☐ User account recovery: Email only                                       │
│                                                                              │
│  Step 3 - Sign-up experience:                                               │
│  ☐ Self-registration: Enable                                               │
│  ☐ Required attributes: email (already selected)                           │
│                                                                              │
│  Step 4 - Message delivery:                                                 │
│  ☐ Email provider: Send email with Cognito (free tier: 50/day)            │
│  ☐ FROM email: no-reply@verificationemail.com (default)                   │
│                                                                              │
│  Step 5 - App integration:                                                  │
│  ☐ User pool name: budget-app-users                                       │
│  ☐ Hosted authentication pages: Use Cognito Hosted UI                     │
│  ☐ Domain: budget-app-xxx (must be unique)                                 │
│  ☐ App client name: budget-web                                             │
│  ☐ Client secret: Don't generate (SPA = public client)                    │
│  ☐ Callback URLs: http://localhost:5173, https://your-domain.com          │
│  ☐ Sign-out URLs: http://localhost:5173, https://your-domain.com          │
│                                                                              │
│  ☐ Create user pool                                                        │
│                                                                              │
│  📝 Note User Pool ID: _______________________                             │
│     (e.g., eu-central-1_AbC123xYz)                                         │
│  📝 Note App Client ID: _______________________                            │
│     (e.g., 1a2b3c4d5e6f7g8h9i0j)                                           │
│  📝 Note Cognito Domain: _______________________                           │
│     (e.g., budget-app-xxx.auth.eu-central-1.amazoncognito.com)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3.2: Add Google as Identity Provider (Optional)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Cognito → User pool → Sign-in experience → Identity providers   │
│                                                                              │
│  First, set up Google OAuth:                                                │
│  ☐ Go to console.cloud.google.com → APIs & Services → Credentials         │
│  ☐ Create OAuth 2.0 Client ID (Web application)                           │
│  ☐ Authorized redirect URIs:                                               │
│    https://budget-app-xxx.auth.eu-central-1.amazoncognito.com/oauth2/idpresponse
│                                                                              │
│  📝 Google Client ID: _______________________                              │
│  📝 Google Client Secret: _______________________                          │
│                                                                              │
│  Back in Cognito:                                                           │
│  ☐ Click "Add identity provider" → Google                                 │
│  ☐ Paste Google Client ID and Secret                                      │
│  ☐ Attribute mapping: email → email                                       │
│  ☐ Add provider                                                            │
│                                                                              │
│  ☐ Go to App client → Hosted UI → Edit                                    │
│  ☐ Enable Google in "Identity providers"                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 4: DynamoDB & S3 Setup (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4.1: Create DynamoDB Table                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → DynamoDB → Tables                       │
│                                                                              │
│  ☐ Click "Create table"                                                    │
│  ☐ Table name: BudgetApp                                                   │
│  ☐ Partition key: PK (String)                                              │
│  ☐ Sort key: SK (String)                                                   │
│  ☐ Table settings: Customize settings                                     │
│  ☐ Table class: DynamoDB Standard                                         │
│  ☐ Read/write capacity: On-demand (pay per request, free tier eligible)   │
│  ☐ Encryption: AWS owned key (free)                                       │
│  ☐ Create table                                                            │
│                                                                              │
│  After creation, add GSIs:                                                  │
│  ☐ Go to table → Indexes → Create index                                   │
│  ☐ GSI1: Partition key = GSI1PK, Sort key = GSI1SK                        │
│    (For queries like: all transactions by date)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4.2: Create S3 Bucket for Uploads                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → S3 → Buckets                            │
│                                                                              │
│  ☐ Click "Create bucket"                                                   │
│  ☐ Bucket name: budget-app-uploads-xxx (must be globally unique)          │
│  ☐ Region: eu-central-1                                                   │
│  ☐ Object Ownership: ACLs disabled                                        │
│  ☐ Block all public access: ✓ ON (keep blocked)                          │
│  ☐ Bucket Versioning: Disable (optional: enable for recovery)            │
│  ☐ Encryption: SSE-S3 (free)                                              │
│  ☐ Create bucket                                                           │
│                                                                              │
│  Add lifecycle rule:                                                        │
│  ☐ Go to bucket → Management → Create lifecycle rule                      │
│  ☐ Rule name: delete-old-files                                            │
│  ☐ Apply to all objects                                                    │
│  ☐ Lifecycle rule actions: Expire current versions after 365 days        │
│                                                                              │
│  📝 Note Bucket Name: _______________________                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: GitHub OIDC for AWS (20 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.1: Create OIDC Identity Provider in AWS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → IAM → Identity providers               │
│                                                                              │
│  This allows GitHub Actions to authenticate to AWS without stored keys!    │
│                                                                              │
│  ☐ Click "Add provider"                                                    │
│  ☐ Provider type: OpenID Connect                                          │
│  ☐ Provider URL: https://token.actions.githubusercontent.com              │
│  ☐ Click "Get thumbprint"                                                  │
│  ☐ Audience: sts.amazonaws.com                                            │
│  ☐ Add provider                                                            │
│                                                                              │
│  📝 Provider ARN saved automatically                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.2: Create IAM Role for GitHub Actions                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → IAM → Roles                            │
│                                                                              │
│  ☐ Click "Create role"                                                     │
│  ☐ Trusted entity: Web identity                                            │
│  ☐ Identity provider: token.actions.githubusercontent.com                 │
│  ☐ Audience: sts.amazonaws.com                                            │
│  ☐ Next                                                                    │
│                                                                              │
│  ☐ Add permissions (for initial setup - can restrict later):              │
│    • AdministratorAccess (or create custom policy)                        │
│                                                                              │
│  ☐ Role name: github-actions-deploy                                       │
│  ☐ Create role                                                             │
│                                                                              │
│  ☐ Edit trust policy to restrict to your repository:                      │
│                                                                              │
│  {                                                                          │
│    "Version": "2012-10-17",                                                │
│    "Statement": [{                                                         │
│      "Effect": "Allow",                                                    │
│      "Principal": {                                                        │
│        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/               │
│                      token.actions.githubusercontent.com"                  │
│      },                                                                    │
│      "Action": "sts:AssumeRoleWithWebIdentity",                           │
│      "Condition": {                                                        │
│        "StringEquals": {                                                   │
│          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"   │
│        },                                                                  │
│        "StringLike": {                                                     │
│          "token.actions.githubusercontent.com:sub":                       │
│            "repo:YOUR_USERNAME/budget-app:*"                               │
│        }                                                                   │
│      }                                                                     │
│    }]                                                                      │
│  }                                                                         │
│                                                                              │
│  📝 Note Role ARN: arn:aws:iam::ACCOUNT_ID:role/github-actions-deploy     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5.3: Add GitHub Repository Secrets                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: github.com → Repository → Settings → Secrets → Actions          │
│                                                                              │
│  Add these repository secrets:                                              │
│                                                                              │
│  ┌─────────────────────────────────┬────────────────────────────────────┐  │
│  │ Secret Name                     │ Value                              │  │
│  ├─────────────────────────────────┼────────────────────────────────────┤  │
│  │ AWS_DEPLOY_ROLE_ARN             │ arn:aws:iam::123.../role/github-..│  │
│  │ COGNITO_USER_POOL_ID            │ eu-central-1_AbC123xYz            │  │
│  │ COGNITO_CLIENT_ID               │ 1a2b3c4d5e6f7g8h9i0j              │  │
│  │ COGNITO_DOMAIN                  │ budget-app-xxx.auth.eu-central-1..│  │
│  │ API_URL                         │ https://xxx.execute-api.eu-central.│  │
│  │ S3_BUCKET                       │ budget-app-uploads-xxx             │  │
│  │ DYNAMODB_TABLE                  │ BudgetApp                          │  │
│  └─────────────────────────────────┴────────────────────────────────────┘  │
│                                                                              │
│  Optional: Create "production" environment for additional protection       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 6: Amplify Hosting Setup (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.1: Connect Amplify to GitHub                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → Amplify                                 │
│                                                                              │
│  ☐ Click "Get Started" under Amplify Hosting                              │
│  ☐ Select "GitHub" as source                                              │
│  ☐ Authorize AWS Amplify to access your GitHub account                    │
│  ☐ Select repository: YOUR_USERNAME/budget-app                            │
│  ☐ Select branch: main                                                    │
│                                                                              │
│  Build settings:                                                            │
│  ☐ App name: budget-app                                                   │
│  ☐ Environment: Production                                                │
│  ☐ Build settings: Monorepo (select src/web as app root)                 │
│  ☐ Build command: npm run build                                           │
│  ☐ Build output directory: dist                                          │
│                                                                              │
│  Environment variables:                                                     │
│  ☐ VITE_API_URL = (add after Lambda deploy)                               │
│  ☐ VITE_COGNITO_USER_POOL_ID = eu-central-1_AbC123xYz                    │
│  ☐ VITE_COGNITO_CLIENT_ID = 1a2b3c4d5e6f7g8h9i0j                         │
│  ☐ VITE_AWS_REGION = eu-central-1                                        │
│                                                                              │
│  📝 Note the Amplify URL:                                                  │
│     https://main.xxxxx.amplifyapp.com                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6.2: Add Amplify URL to Cognito                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → Cognito → User pool → App client      │
│                                                                              │
│  ☐ Edit Hosted UI settings                                                │
│  ☐ Add to Allowed callback URLs:                                          │
│    https://main.xxxxx.amplifyapp.com                                       │
│  ☐ Add to Allowed sign-out URLs:                                          │
│    https://main.xxxxx.amplifyapp.com                                       │
│  ☐ Save changes                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Lambda & API Gateway Deployment (30 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.1: Initialize CDK Project                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal (local)                                                  │
│                                                                              │
│  # Navigate to infra folder                                                │
│  $ cd infra                                                                │
│                                                                              │
│  # Install CDK dependencies                                                 │
│  $ npm install                                                             │
│                                                                              │
│  # Bootstrap CDK (one-time per account/region)                             │
│  $ cdk bootstrap aws://ACCOUNT_ID/eu-central-1                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.2: Deploy Lambda via CDK                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: Terminal                                                          │
│                                                                              │
│  # Build the .NET Lambda with Native AOT                                   │
│  $ cd src/api/BudgetApp.Api                                                │
│  $ dotnet publish -c Release -r linux-x64 --self-contained                │
│                                                                              │
│  # Deploy CDK stack                                                        │
│  $ cd ../../../infra                                                       │
│  $ cdk deploy BudgetAppStack --require-approval never                     │
│                                                                              │
│  📝 Note the API Gateway URL from output:                                  │
│     https://xxxxx.execute-api.eu-central-1.amazonaws.com                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.3: Update Amplify with API URL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform: console.aws.amazon.com → Amplify → App → Environment variables │
│                                                                              │
│  ☐ Add/Update: VITE_API_URL = https://xxxxx.execute-api.eu-central-1...   │
│  ☐ Redeploy: Go to Amplify → Redeploy this version                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7.4: Verify Deployment                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ☐ Open https://main.xxxxx.amplifyapp.com                                 │
│  ☐ Click "Sign in" - should redirect to Cognito Hosted UI                │
│  ☐ Create account or sign in                                              │
│  ☐ Verify you can access the dashboard                                    │
│  ☐ Check CloudWatch Logs for Lambda execution                             │
│                                                                              │
│  🎉 Congratulations! Your app is live on AWS!                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 8: Automate with GitHub Actions (15 minutes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 8.1: Commit Workflow Files                                            │
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
☐ AWS CLI v2 installed & configured
☐ AWS CDK installed

PHASE 1: GitHub
☐ Repository created
☐ Branch protection configured (optional)

PHASE 2: AWS Account
☐ AWS account created
☐ Budget alerts set up ($5 warning)
☐ IAM user created for CLI access
☐ AWS CLI configured locally

PHASE 3: Cognito
☐ User Pool created
☐ App client configured (no secret)
☐ Hosted UI domain set up
☐ Google identity provider (optional)
☐ Callback URLs configured

PHASE 4: DynamoDB & S3
☐ BudgetApp table created (PK, SK)
☐ GSI1 created for alternate access patterns
☐ S3 bucket created for uploads
☐ Lifecycle rules configured

PHASE 5: GitHub OIDC
☐ OIDC provider created in IAM
☐ IAM role for GitHub Actions created
☐ Trust policy restricts to your repo
☐ GitHub secrets configured

PHASE 6: Amplify Hosting
☐ Connected to GitHub repository
☐ Build settings configured for src/web
☐ Environment variables set
☐ Amplify URL added to Cognito callbacks

PHASE 7: Lambda & API Gateway
☐ CDK bootstrapped
☐ Lambda deployed via CDK
☐ API Gateway URL obtained
☐ Amplify updated with API URL
☐ End-to-end verification passed

PHASE 8: CI/CD
☐ Workflow files committed
☐ Pipeline tested with PR
☐ Automated deployments working
```

---

## Appendix A: IAM Policy Examples

### Lambda Execution Role Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:ACCOUNT_ID:table/BudgetApp",
        "arn:aws:dynamodb:eu-central-1:ACCOUNT_ID:table/BudgetApp/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::budget-app-uploads-xxx/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Appendix B: Environment Variables

### Backend (Lambda)

```bash
# AWS (set via CDK/environment)
AWS_REGION=eu-central-1
DYNAMODB_TABLE_NAME=BudgetApp
S3_BUCKET_NAME=budget-app-uploads-xxx
COGNITO_USER_POOL_ID=eu-central-1_AbC123xYz

# App
ASPNETCORE_ENVIRONMENT=Production
```

### Frontend (Build-time via Amplify)

```bash
VITE_API_URL=https://xxxxx.execute-api.eu-central-1.amazonaws.com
VITE_COGNITO_USER_POOL_ID=eu-central-1_AbC123xYz
VITE_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
VITE_COGNITO_DOMAIN=budget-app-xxx.auth.eu-central-1.amazoncognito.com
VITE_AWS_REGION=eu-central-1
```

---

## Appendix C: Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/your-username/budget-app.git
cd budget-app

# Start local AWS services (DynamoDB Local, LocalStack)
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

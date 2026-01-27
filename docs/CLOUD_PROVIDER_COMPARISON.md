# Cloud Provider Comparison: GCP vs AWS
## Budget Management Application

**Version:** 1.0  
**Date:** January 27, 2026  
**Purpose:** Compare hosting options between Google Cloud Platform and Amazon Web Services

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Service Mapping](#2-service-mapping)
3. [Free Tier Comparison](#3-free-tier-comparison)
4. [Architecture: GCP Stack](#4-architecture-gcp-stack)
5. [Architecture: AWS Stack](#5-architecture-aws-stack)
6. [Detailed Service Comparison](#6-detailed-service-comparison)
7. [Authentication Options](#7-authentication-options)
8. [Developer Experience](#8-developer-experience)
9. [Cost Analysis](#9-cost-analysis)
10. [Learning Curve](#10-learning-curve)
11. [Setup Complexity](#11-setup-complexity)
12. [Recommendation](#12-recommendation)

---

## 1. Executive Summary

### Quick Comparison

| Factor | GCP (Firebase + Cloud Run) | AWS (DynamoDB + Lambda/ECS) | Winner |
|--------|---------------------------|----------------------------|--------|
| **Database Free Tier** | 1 GB storage | **25 GB storage** | ✅ AWS |
| **Database Free Reads** | 50K/day | **25 GB-months** | ✅ AWS |
| **Compute Free Tier** | 2M requests/month | 1M requests/month (Lambda) | GCP |
| **Auth Free Tier** | Unlimited MAU | 50K MAU (Cognito) | GCP |
| **Static Hosting** | 10 GB, CDN included | S3 + CloudFront (more setup) | GCP |
| **Setup Simplicity** | Easier (Firebase) | More complex | GCP |
| **Learning Value** | You know it | **New skills** | ✅ AWS |
| **.NET Support** | Excellent | Excellent | Tie |
| **Ecosystem Integration** | Tight (Firebase) | More modular | Depends |
| **Enterprise Adoption** | Growing | **Market leader** | ✅ AWS |

### Bottom Line

| Scenario | Recommended Provider |
|----------|---------------------|
| **Get MVP running fastest** | GCP (Firebase) |
| **Learn new cloud platform** | AWS |
| **Maximum free storage** | AWS (25 GB DynamoDB) |
| **Simplest authentication** | GCP (Firebase Auth) |
| **Best job market skills** | AWS |
| **Lowest initial complexity** | GCP |

---

## 2. Service Mapping

### Equivalent Services

| Function | GCP Service | AWS Service | Notes |
|----------|-------------|-------------|-------|
| **NoSQL Database** | Firestore | DynamoDB | Both serverless, different query models |
| **Serverless Compute** | Cloud Run | AWS Lambda + API Gateway | Cloud Run = containers, Lambda = functions |
| **Container Compute** | Cloud Run | ECS Fargate / App Runner | App Runner is simpler |
| **Object Storage** | Cloud Storage | S3 | Nearly identical |
| **Static Hosting** | Firebase Hosting | S3 + CloudFront / Amplify Hosting | Amplify is simpler |
| **Authentication** | Firebase Auth | Cognito | Firebase is easier |
| **API Gateway** | (Built into Cloud Run) | API Gateway / API Gateway HTTP | Separate service in AWS |
| **CI/CD** | Cloud Build | CodePipeline / CodeBuild | Or use GitHub Actions for both |
| **Secrets** | Secret Manager | Secrets Manager / Parameter Store | Nearly identical |
| **Monitoring** | Cloud Monitoring | CloudWatch | Nearly identical |
| **IaC** | Terraform / Deployment Manager | Terraform / CloudFormation / CDK | CDK is excellent |

---

## 3. Free Tier Comparison

### Database: Firestore vs DynamoDB

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE FREE TIER COMPARISON                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FIRESTORE (GCP)                     │  DYNAMODB (AWS)                       │
│  ─────────────────                   │  ──────────────                       │
│                                      │                                       │
│  Storage: 1 GB                       │  Storage: 25 GB              ✅ 25x   │
│                                      │                                       │
│  Reads: 50,000/day                   │  Reads: 25 RCU (≈2.16M/day)  ✅ 43x   │
│         (~1.5M/month)                │         (25 GB-months)                │
│                                      │                                       │
│  Writes: 20,000/day                  │  Writes: 25 WCU (≈2.16M/day) ✅ 108x  │
│          (~600K/month)               │          (25 GB-months)               │
│                                      │                                       │
│  Deletes: 20,000/day                 │  (Included in writes)                 │
│                                      │                                       │
│  Network: 10 GB/month                │  Network: 1 GB/month (then $0.09/GB) │
│                                      │                                       │
│  Duration: Forever (Always Free)    │  Duration: Forever (Always Free)     │
│                                      │                                       │
│  ⚠️ Daily limits reset at midnight  │  ✅ Monthly capacity, more flexible   │
│                                      │                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Winner: AWS DynamoDB (significantly more generous)
```

### Compute: Cloud Run vs Lambda/App Runner

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPUTE FREE TIER COMPARISON                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLOUD RUN (GCP)                     │  AWS LAMBDA                           │
│  ───────────────                     │  ──────────                           │
│                                      │                                       │
│  Requests: 2M/month            ✅    │  Requests: 1M/month                   │
│  Compute: 360K GB-seconds      ✅    │  Compute: 400K GB-seconds       ✅    │
│  CPU: 180K vCPU-seconds        ✅    │  (Included above)                     │
│  Concurrency: Unlimited              │  Concurrency: 1000 default            │
│                                      │                                       │
│  Containers: Yes (any runtime)       │  Functions only (or containers)       │
│  Max timeout: 60 min                 │  Max timeout: 15 min                  │
│                                      │                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                      │                                       │
│                                      │  AWS APP RUNNER (Alternative)         │
│                                      │  ─────────────────                    │
│                                      │                                       │
│                                      │  ⚠️ NO free tier                      │
│                                      │  Minimum: ~$5/month                   │
│                                      │  (But simpler than Lambda + API GW)   │
│                                      │                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                      │                                       │
│  Duration: Forever                   │  Duration: Forever                    │
│                                      │                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Winner: GCP Cloud Run (more requests, simpler container model)
```

### Authentication: Firebase Auth vs Cognito

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FREE TIER COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FIREBASE AUTH (GCP)                 │  AWS COGNITO                          │
│  ───────────────────                 │  ───────────                          │
│                                      │                                       │
│  MAU: Unlimited              ✅      │  MAU: 50,000/month                    │
│                                      │  (Then $0.0055/MAU)                   │
│                                      │                                       │
│  Phone auth: 10K/month               │  SMS: Pay per message                 │
│                                      │                                       │
│  Social login: Free                  │  Social login: Free                   │
│                                      │                                       │
│  Email/password: Free                │  Email/password: Free                 │
│                                      │                                       │
│  MFA: Free (TOTP)                    │  MFA: Free (TOTP, SMS extra)         │
│                                      │                                       │
│  Custom tokens: Free                 │  Lambda triggers: Pay per invocation  │
│                                      │                                       │
│  Setup: Very easy             ✅     │  Setup: More complex                  │
│                                      │                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Winner: Firebase Auth (unlimited MAU, simpler)
```

### Static Hosting: Firebase Hosting vs S3/Amplify

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STATIC HOSTING FREE TIER COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FIREBASE HOSTING (GCP)              │  AWS AMPLIFY HOSTING                  │
│  ──────────────────────              │  ────────────────────                 │
│                                      │                                       │
│  Storage: 10 GB              ✅      │  Storage: 5 GB                        │
│  Bandwidth: 360 MB/day               │  Bandwidth: 15 GB/month        ✅     │
│            (~10 GB/month)            │                                       │
│                                      │                                       │
│  Build minutes: N/A (external CI)    │  Build minutes: 1000/month     ✅     │
│                                      │                                       │
│  SSL: Included               ✅      │  SSL: Included                 ✅     │
│  CDN: Global                 ✅      │  CDN: CloudFront (global)      ✅     │
│                                      │                                       │
│  Preview deployments: Yes     ✅     │  Preview deployments: Yes      ✅     │
│                                      │                                       │
│  Custom domain: Free         ✅      │  Custom domain: Free           ✅     │
│                                      │                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                      │                                       │
│                                      │  S3 + CLOUDFRONT (Manual Setup)       │
│                                      │  ────────────────────────────         │
│                                      │  S3: 5 GB storage                     │
│                                      │  S3: 20K GET, 2K PUT/month            │
│                                      │  CloudFront: 1 TB/month        ✅     │
│                                      │  CloudFront: 10M requests/month ✅    │
│                                      │  ⚠️ More setup, more control          │
│                                      │                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Winner: Tie (Firebase easier, AWS Amplify more bandwidth)
```

### Object Storage: Cloud Storage vs S3

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 OBJECT STORAGE FREE TIER COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLOUD STORAGE (GCP)                 │  S3 (AWS)                             │
│  ───────────────────                 │  ────────                             │
│                                      │                                       │
│  Storage: 5 GB               ✅      │  Storage: 5 GB               ✅       │
│                                      │                                       │
│  Operations:                         │  Operations:                          │
│    Class A: 5,000/month              │    PUT: 2,000/month                   │
│    Class B: 50,000/month             │    GET: 20,000/month                  │
│                                      │                                       │
│  Egress: 1 GB/month                  │  Egress: 100 GB/month          ✅     │
│  (to internet)                       │  (to internet, first 12 months)       │
│                                      │                                       │
│  Duration: Always Free               │  12 months (then pay-as-you-go)       │
│                                      │  ⚠️ S3 not "always free"              │
│                                      │                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Winner: GCP (always free vs 12-month trial for S3)
```

### Summary: Free Tier Totals

| Resource | GCP Total | AWS Total | Winner |
|----------|-----------|-----------|--------|
| **Database Storage** | 1 GB | 25 GB | ✅ AWS |
| **Database Operations** | ~1.5M reads/month | ~65M reads/month | ✅ AWS |
| **Compute Requests** | 2M/month | 1M/month | GCP |
| **Auth Users** | Unlimited | 50K MAU | GCP |
| **Static Hosting** | 10 GB storage | 5 GB storage | GCP |
| **Object Storage** | 5 GB (forever) | 5 GB (12 months) | GCP |

**Overall Free Tier Winner:** 
- **AWS** if database storage/operations are your priority (DynamoDB is much more generous)
- **GCP** if simplicity and auth are priorities

---

## 4. Architecture: GCP Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GCP ARCHITECTURE                                     │
│                    (Firebase + Cloud Run Stack)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                              │  │
│  │                    Hosted on: Firebase Hosting                         │  │
│  │                    CDN: Global (automatic)                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    │ HTTPS                                   │
│                                    ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              ASP.NET Core 8 Container                                  │  │
│  │              Hosted on: Cloud Run                                      │  │
│  │              Scales: 0 to N (auto)                                     │  │
│  │              URL: *.run.app (or custom domain)                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                          │                    │                              │
│                          ▼                    ▼                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                      │
│                                                                              │
│  ┌─────────────────────┐              ┌─────────────────────┐               │
│  │     Firestore       │              │   Cloud Storage     │               │
│  │  ┌───────────────┐  │              │  ┌───────────────┐  │               │
│  │  │ users/        │  │              │  │ uploads/      │  │               │
│  │  │ transactions/ │  │              │  │ {userId}/     │  │               │
│  │  │ categories/   │  │              │  │ {files}       │  │               │
│  │  └───────────────┘  │              │  └───────────────┘  │               │
│  └─────────────────────┘              └─────────────────────┘               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           AUTHENTICATION                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Firebase Auth                                    │  │
│  │          Providers: Google, Email/Password                            │  │
│  │          Integrates with: Firestore security rules                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              CI/CD                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  GitHub Actions → Cloud Build → Cloud Run / Firebase Hosting          │  │
│  │  Auth: Workload Identity Federation (no stored keys)                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Pros:
✅ Tight integration (Firebase + GCP = same project)
✅ Firebase Auth integrates with Firestore security rules
✅ Cloud Run handles containers natively (no Lambda cold start issues for .NET)
✅ Simple deployment (firebase deploy, gcloud run deploy)
✅ Unlimited auth users

Cons:
❌ Firestore free tier is limited (1 GB storage, 50K reads/day)
❌ Less industry adoption than AWS
❌ Fewer third-party tutorials/resources
```

---

## 5. Architecture: AWS Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS ARCHITECTURE                                     │
│                  (DynamoDB + Lambda/Container Stack)                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTION A: SERVERLESS                                 │
│                    (Lambda + API Gateway + DynamoDB)                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                              │  │
│  │                    Hosted on: S3 + CloudFront                          │  │
│  │                    OR: AWS Amplify Hosting (simpler)                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    │ HTTPS                                   │
│                                    ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API LAYER                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway (HTTP API)                              │  │
│  │              Routes requests to Lambda functions                       │  │
│  │              Handles: CORS, throttling, auth                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AWS Lambda (.NET 8)                                 │  │
│  │              ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │              │ ImportFunc  │  │TransactFunc │  │ DashFunc    │        │  │
│  │              └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │              ⚠️ Cold starts can be 3-10s for .NET                     │  │
│  │              💡 Use .NET 8 Native AOT to reduce to ~1s                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                          │                    │                              │
│                          ▼                    ▼                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                      │
│                                                                              │
│  ┌─────────────────────┐              ┌─────────────────────┐               │
│  │     DynamoDB        │              │        S3           │               │
│  │  ┌───────────────┐  │              │  ┌───────────────┐  │               │
│  │  │ Users table   │  │              │  │ uploads/      │  │               │
│  │  │ Transactions  │  │              │  │ {userId}/     │  │               │
│  │  │ (single table)│  │              │  │ {files}       │  │               │
│  │  └───────────────┘  │              │  └───────────────┘  │               │
│  │  25 GB FREE! 🎉     │              │                     │               │
│  └─────────────────────┘              └─────────────────────┘               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           AUTHENTICATION                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       AWS Cognito                                      │  │
│  │          User Pools: Email, Google, Social                            │  │
│  │          50K MAU free (sufficient for personal app)                   │  │
│  │          Lambda triggers for customization                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              CI/CD                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  GitHub Actions → AWS (via OIDC)                                      │  │
│  │  Deploy: SAM / CDK / Terraform                                        │  │
│  │  Auth: GitHub OIDC → IAM Role (no stored keys)                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTION B: CONTAINERS                                 │
│                    (App Runner + DynamoDB) - RECOMMENDED                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                              │  │
│  │                    Hosted on: AWS Amplify Hosting                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    │ HTTPS                                   │
│                                    ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              AWS App Runner (Containers)                               │  │
│  │              ASP.NET Core 8 Container                                  │  │
│  │              Scales: Auto (min 1 instance)                            │  │
│  │              ⚠️ NO free tier (~$5-15/month minimum)                   │  │
│  │              ✅ No cold starts, simpler than Lambda                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                          │                    │                              │
│                          ▼                    ▼                              │
│                    [ DynamoDB ]        [     S3     ]                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTION C: ECS FARGATE                                │
│                    (More control, more complexity)                           │
└─────────────────────────────────────────────────────────────────────────────┘

│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              ECS Fargate                                               │  │
│  │              ASP.NET Core 8 Container                                  │  │
│  │              + Application Load Balancer                              │  │
│  │              ⚠️ NO free tier for Fargate                              │  │
│  │              ⚠️ ALB costs ~$16/month minimum                          │  │
│  │              ✅ Production-grade, most control                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │

Recommendation for AWS: Lambda for free tier, App Runner for simplicity + cost
```

### AWS Option Comparison

| Factor | Lambda + API GW | App Runner | ECS Fargate |
|--------|----------------|------------|-------------|
| **Free Tier** | ✅ Yes (1M requests) | ❌ No (~$5/month) | ❌ No (~$20/month) |
| **Cold Starts** | ⚠️ 3-10s (.NET) | ✅ None | ✅ None |
| **.NET Native AOT** | ✅ Reduces to ~1s | N/A | N/A |
| **Setup Complexity** | High | Low | High |
| **Scaling** | Instant | Auto (slower) | Auto |
| **Best For** | Lowest cost | Simplicity | Production |

**Recommendation for learning AWS:** Start with **Lambda + API Gateway** (free tier), then migrate to App Runner if cold starts are unbearable.

---

## 6. Detailed Service Comparison

### Database: Firestore vs DynamoDB

| Feature | Firestore | DynamoDB |
|---------|-----------|----------|
| **Data Model** | Document (JSON-like) | Key-value + Document |
| **Query Language** | Firebase SDK | PartiQL (SQL-like) or SDK |
| **Secondary Indexes** | Composite indexes (manual) | GSI/LSI (manual) |
| **Transactions** | ✅ Multi-document | ✅ Multi-item |
| **Real-time Updates** | ✅ Built-in listeners | Via Streams (more setup) |
| **Schema** | Schemaless | Schemaless |
| **Pricing Model** | Per operation + storage | Per RCU/WCU + storage |
| **Free Tier Storage** | 1 GB | **25 GB** |
| **Querying Flexibility** | Better for nested docs | Better for flat data |
| **Learning Curve** | Easier | Steeper (single-table design) |

#### DynamoDB Single-Table Design (AWS Best Practice)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DynamoDB prefers "single-table design" - all entities in one table        │
│  This is different from Firestore's collection-per-entity approach!        │
└─────────────────────────────────────────────────────────────────────────────┘

Table: BudgetApp
┌──────────────────┬────────────────────┬─────────────────────────────────────┐
│ PK (Partition)   │ SK (Sort Key)      │ Attributes                          │
├──────────────────┼────────────────────┼─────────────────────────────────────┤
│ USER#u123        │ PROFILE            │ email, displayName, currency, ...   │
│ USER#u123        │ TXN#2025-01-15#001 │ amount, description, category, ...  │
│ USER#u123        │ TXN#2025-01-15#002 │ amount, description, category, ...  │
│ USER#u123        │ TXN#2025-01-14#001 │ amount, description, category, ...  │
│ USER#u123        │ IMPORT#imp001      │ fileName, status, count, ...        │
│ USER#u123        │ CAT#cat001         │ name, icon, color, ...              │
│ USER#u123        │ RULE#rule001       │ matchType, matchValue, category, ...|
├──────────────────┼────────────────────┼─────────────────────────────────────┤
│ USER#u456        │ PROFILE            │ ... (another user's data)          │
│ USER#u456        │ TXN#2025-01-15#001 │ ...                                 │
└──────────────────┴────────────────────┴─────────────────────────────────────┘

Query patterns:
• Get user profile: PK = "USER#u123", SK = "PROFILE"
• Get all transactions: PK = "USER#u123", SK begins_with "TXN#"
• Get transactions for month: PK = "USER#u123", SK between "TXN#2025-01" and "TXN#2025-02"
• Get all categories: PK = "USER#u123", SK begins_with "CAT#"

GSI (Global Secondary Index) for additional access patterns:
• GSI1: Query by category across all users' transactions
• GSI2: Query by import ID
```

### Compute: Cloud Run vs Lambda

| Feature | Cloud Run | AWS Lambda |
|---------|-----------|------------|
| **Unit of Deployment** | Container | Function (or container) |
| **Max Execution Time** | 60 minutes | 15 minutes |
| **Cold Start (.NET 8)** | 1-3 seconds | 3-10 seconds |
| **Cold Start (Native AOT)** | N/A | ~1 second |
| **Concurrency** | Per instance (up to 1000) | Per function (default 1000) |
| **HTTP Handling** | Built-in | Needs API Gateway |
| **WebSockets** | ✅ Supported | Via API Gateway WebSocket |
| **Min Instances** | 0 (scale to zero) | 0 (or Provisioned Concurrency $$$) |
| **Pricing** | Per request + CPU/memory time | Per request + duration |
| **Free Tier** | 2M requests, 360K GB-sec | 1M requests, 400K GB-sec |

### Static Hosting: Firebase Hosting vs Amplify

| Feature | Firebase Hosting | AWS Amplify Hosting |
|---------|-----------------|---------------------|
| **Setup** | Very easy | Easy |
| **CLI** | `firebase deploy` | `amplify publish` |
| **GitHub Integration** | Manual or via Actions | Built-in |
| **Preview Deployments** | ✅ | ✅ |
| **Custom Domains** | ✅ Free SSL | ✅ Free SSL |
| **Build Minutes** | External CI | 1000/month free |
| **Storage Free** | 10 GB | 5 GB |
| **Bandwidth Free** | ~10 GB/month | 15 GB/month |

---

## 7. Authentication Options

### Firebase Auth (GCP)

```
Setup Steps:
1. Enable in Firebase Console
2. Configure providers (Google, Email) - clicks only
3. Add Firebase SDK to React app
4. Call signInWithPopup() or signInWithEmailAndPassword()
5. Get ID token, send to backend
6. Backend validates with Firebase Admin SDK

Time to implement: ~1 hour

Code complexity: Low
```

### AWS Cognito

```
Setup Steps:
1. Create User Pool in Cognito console
2. Create App Client
3. Configure OAuth settings, callback URLs
4. Set up Google as identity provider (if needed)
   - Create Google OAuth credentials
   - Configure in Cognito
5. Add Amplify Auth or Cognito SDK to React
6. Configure SDK with User Pool details
7. Implement sign-in flows
8. Get JWT tokens, send to backend
9. Backend validates with Cognito public keys

Time to implement: ~3-4 hours

Code complexity: Medium-High
```

### Comparison

| Feature | Firebase Auth | Cognito |
|---------|--------------|---------|
| **Setup Time** | 1 hour | 3-4 hours |
| **Social Login Setup** | 2 clicks | 10+ steps |
| **React SDK** | Excellent | Good (Amplify) |
| **Customization** | Limited | Extensive (Lambda triggers) |
| **Hosted UI** | Polished | Functional but basic |
| **Free Tier** | Unlimited | 50K MAU |
| **MFA** | ✅ Easy | ✅ Flexible |
| **Learning Curve** | Low | Medium |

---

## 8. Developer Experience

### Local Development

| Aspect | GCP | AWS |
|--------|-----|-----|
| **Database Emulator** | ✅ Firebase Emulator (excellent) | ✅ DynamoDB Local (docker) |
| **Auth Emulator** | ✅ Firebase Auth Emulator | ❌ No Cognito emulator |
| **Compute Emulator** | Docker (same as prod) | SAM Local / Docker |
| **Full Stack Local** | `firebase emulators:start` | Multiple tools needed |
| **Hot Reload** | ✅ Works great | ✅ Works great |

### Infrastructure as Code

| Tool | GCP | AWS |
|------|-----|-----|
| **Native IaC** | Deployment Manager | CloudFormation |
| **Best IaC** | Terraform | CDK (TypeScript/C#) |
| **Ease of Use** | Terraform is great | CDK is excellent |
| **Type Safety** | Terraform HCL | CDK has full types |

**AWS CDK Example:**
```typescript
// AWS CDK is genuinely excellent for .NET developers
const table = new dynamodb.Table(this, 'BudgetTable', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});

const api = new lambda.Function(this, 'BudgetApi', {
  runtime: lambda.Runtime.DOTNET_8,
  handler: 'BudgetApp.Api',
  code: lambda.Code.fromAsset('./src/api/publish'),
});

table.grantReadWriteData(api);
```

### CLI Tools

| Tool | GCP | AWS |
|------|-----|-----|
| **Main CLI** | `gcloud` | `aws` |
| **Quality** | Good | Good |
| **Firebase CLI** | `firebase` (excellent) | N/A |
| **Amplify CLI** | N/A | `amplify` (good) |
| **Learning Curve** | Medium | Medium-High |

---

## 9. Cost Analysis

### Scenario: Personal Use (1-10 users)

| Service | GCP Monthly | AWS Monthly |
|---------|-------------|-------------|
| **Database** | $0 (within free tier) | $0 (within free tier) |
| **Compute** | $0 (Cloud Run free tier) | $0 (Lambda free tier) |
| **Auth** | $0 (Firebase Auth) | $0 (Cognito <50K) |
| **Static Hosting** | $0 (Firebase Hosting) | $0 (Amplify/S3+CF) |
| **Object Storage** | $0 (GCS free tier) | $0 (S3 - 12 months) |
| **TOTAL** | **$0** | **$0** |

### Scenario: Growing (100 users, moderate usage)

| Service | GCP Monthly | AWS Monthly |
|---------|-------------|-------------|
| **Database** | ~$1-5 (exceed free tier) | $0 (still within 25GB) |
| **Compute** | $0-2 | $0-2 |
| **Auth** | $0 | $0 |
| **Static Hosting** | $0 | $0 |
| **Object Storage** | $0-1 | $0-1 |
| **TOTAL** | **~$1-8** | **~$0-3** |

### Scenario: AWS with App Runner (No Free Tier)

| Service | AWS Monthly |
|---------|-------------|
| **App Runner** | ~$5-15 (minimum always-on) |
| **DynamoDB** | $0 |
| **Other** | $0-2 |
| **TOTAL** | **~$5-17** |

### Long-term Cost Winner

- **Free tier stage:** Both are $0, but AWS DynamoDB has more headroom
- **Growth stage:** AWS is cheaper due to DynamoDB free tier
- **Scale stage:** Depends on usage patterns, both are competitive

---

## 10. Learning Curve

### If You Choose AWS (New Platform)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AWS LEARNING ROADMAP                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Week 1: Fundamentals
├── ☐ AWS Account setup, IAM basics
├── ☐ AWS Console navigation
├── ☐ AWS CLI installation and configuration
├── ☐ S3 basics (create bucket, upload file)
└── ☐ DynamoDB basics (create table, CRUD operations)

Week 2: Compute & API
├── ☐ Lambda fundamentals (create function, test)
├── ☐ API Gateway basics (create HTTP API)
├── ☐ Connect Lambda to API Gateway
├── ☐ .NET on Lambda (deployment, cold starts)
└── ☐ Native AOT compilation for Lambda

Week 3: Authentication & Frontend
├── ☐ Cognito User Pool setup
├── ☐ Configure social login (Google)
├── ☐ Amplify Hosting setup
├── ☐ React + Amplify Auth integration
└── ☐ Connect frontend to API Gateway

Week 4: Infrastructure & CI/CD
├── ☐ AWS CDK fundamentals
├── ☐ Define infrastructure in code
├── ☐ GitHub Actions + AWS OIDC
├── ☐ Automated deployments
└── ☐ CloudWatch logs and monitoring

Estimated Total Learning Time: 40-60 hours
```

### Key AWS Concepts to Learn

| Concept | Difficulty | Importance |
|---------|------------|------------|
| **IAM (Roles, Policies)** | High | Critical |
| **DynamoDB Data Modeling** | High | Critical |
| **Lambda + API Gateway** | Medium | Critical |
| **Cognito** | Medium | Important |
| **S3** | Low | Important |
| **CloudWatch** | Low | Important |
| **CDK** | Medium | Recommended |
| **VPC** | High | Not needed initially |

### GCP Learning (If Staying)

Since you already know Firebase + GCP basics:

| Task | Estimated Time |
|------|----------------|
| **Cloud Run deep dive** | 4 hours |
| **Firestore optimization** | 4 hours |
| **Workload Identity Federation** | 2 hours |
| **Cloud Monitoring** | 2 hours |
| **TOTAL** | ~12 hours |

---

## 11. Setup Complexity

### GCP Setup (Summarized)

```
Total Steps: ~25
Total Time: ~2.5 hours

Main Tasks:
1. Create Firebase project (5 min)
2. Enable services (10 min)
3. Configure auth (10 min)
4. Set up Firestore (5 min)
5. Configure Cloud Run (15 min)
6. Set up GitHub Actions (30 min)
7. First deployment (30 min)
```

### AWS Setup (New)

```
Total Steps: ~40
Total Time: ~5-6 hours (first time)

Main Tasks:
1. Create AWS account (15 min)
2. Configure IAM (30 min)
3. Set up DynamoDB table (30 min)
4. Create Cognito User Pool (45 min)
5. Configure Lambda + API Gateway (60 min)
6. Set up Amplify Hosting (30 min)
7. Configure GitHub Actions + OIDC (45 min)
8. First deployment (45 min)
9. Debug and troubleshoot (60+ min)
```

### AWS Setup: Detailed Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AWS SETUP ROADMAP                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 0: Prerequisites
☐ AWS Account created
☐ AWS CLI installed
☐ AWS CDK installed (npm install -g aws-cdk)
☐ Configure AWS credentials locally

Phase 1: Foundation (1 hour)
☐ Create IAM user for local development
☐ Create S3 bucket for file uploads
☐ Create DynamoDB table with proper schema
☐ Test basic CRUD operations

Phase 2: Authentication (1 hour)
☐ Create Cognito User Pool
☐ Create App Client
☐ Configure hosted UI domain
☐ Set up Google as identity provider
☐ Test sign-up/sign-in flow in console

Phase 3: Backend API (2 hours)
☐ Create Lambda function (.NET 8)
☐ Configure Native AOT (optional, for cold starts)
☐ Create API Gateway HTTP API
☐ Connect API Gateway to Lambda
☐ Add Cognito authorizer to API Gateway
☐ Test authenticated API calls

Phase 4: Frontend Hosting (30 min)
☐ Set up Amplify Hosting
☐ Connect to GitHub repository
☐ Configure build settings
☐ Deploy frontend

Phase 5: CI/CD (1 hour)
☐ Create IAM role for GitHub Actions
☐ Configure OIDC identity provider
☐ Create GitHub Actions workflows
☐ Test automated deployment

Phase 6: Verification (30 min)
☐ End-to-end test: sign up → upload → view dashboard
☐ Check CloudWatch logs
☐ Verify cold start times

Total: ~6 hours for first-time AWS user
```

---

## 12. Recommendation

### Decision Matrix

| Factor | Weight | GCP Score | AWS Score |
|--------|--------|-----------|-----------|
| **Free Tier Generosity** | 25% | 7/10 | 9/10 |
| **Setup Simplicity** | 20% | 9/10 | 6/10 |
| **Learning Opportunity** | 20% | 4/10 | 10/10 |
| **Developer Experience** | 15% | 9/10 | 7/10 |
| **Industry Relevance** | 10% | 7/10 | 10/10 |
| **Long-term Scalability** | 10% | 8/10 | 9/10 |
| **WEIGHTED SCORE** | 100% | **7.15** | **8.15** |

### My Recommendation: **AWS** 🏆

For YOUR specific situation:

1. **You want to learn AWS** — This is the most compelling reason. AWS skills are highly valuable.

2. **DynamoDB's 25 GB free tier** — Significantly more headroom than Firestore's 1 GB.

3. **You're experienced with .NET** — Lambda .NET 8 works well, especially with Native AOT.

4. **You know React** — The frontend transition is minimal (just different auth SDK).

5. **Personal project = time to learn** — If this were a client project with deadlines, I'd say GCP. For personal learning, AWS is perfect.

### Recommended AWS Stack

```
Frontend:     React + Amplify Hosting
Auth:         Cognito (with Google provider)
API:          Lambda (.NET 8 Native AOT) + API Gateway HTTP API
Database:     DynamoDB (single-table design)
Storage:      S3
IaC:          AWS CDK (TypeScript or C#)
CI/CD:        GitHub Actions + AWS OIDC
Monitoring:   CloudWatch
```

### If You Want Easier Start: GCP

If learning AWS feels too much right now:
- GCP stack is faster to implement
- Firebase Developer Experience is excellent
- You can always migrate later (data models are similar)

### Hybrid Approach (Not Recommended, But Possible)

Some people use:
- Firebase Auth (easiest) + AWS DynamoDB (most storage)

This adds complexity (two cloud vendors, two billing accounts) and isn't worth it for this project. **Pick one and commit.**

---

## Appendix A: AWS Service Quick Reference

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **DynamoDB** | NoSQL Database | 25 GB, 25 RCU, 25 WCU |
| **Lambda** | Serverless Functions | 1M requests, 400K GB-sec |
| **API Gateway** | HTTP API | 1M requests/month (12 months) |
| **S3** | Object Storage | 5 GB (12 months) |
| **Cognito** | Authentication | 50K MAU |
| **Amplify Hosting** | Static Hosting | 5 GB, 15 GB bandwidth |
| **CloudWatch** | Monitoring/Logs | 5 GB logs, 10 metrics |
| **Secrets Manager** | Secrets Storage | 30 days trial, then $0.40/secret |
| **Parameter Store** | Config Storage | Free (standard tier) |
| **CloudFront** | CDN | 1 TB/month, 10M requests |
| **App Runner** | Container Hosting | ❌ No free tier |
| **ECS Fargate** | Container Hosting | ❌ No free tier |

---

## Appendix B: AWS Learning Resources

### Official Documentation
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [Lambda .NET Guide](https://docs.aws.amazon.com/lambda/latest/dg/lambda-csharp.html)
- [CDK Workshop](https://cdkworkshop.com/)

### Courses (Free)
- AWS Skill Builder (free tier)
- freeCodeCamp AWS courses on YouTube
- .NET on AWS YouTube channel

### DynamoDB Single-Table Design
- [Alex DeBrie - DynamoDB Book](https://www.dynamodbbook.com/) (paid, but excellent)
- [AWS re:Invent DynamoDB talks](https://www.youtube.com/results?search_query=reinvent+dynamodb) (free)

### .NET on Lambda
- [AWS .NET GitHub](https://github.com/aws/aws-lambda-dotnet)
- [Native AOT for Lambda](https://aws.amazon.com/blogs/compute/building-serverless-net-applications-on-aws-lambda-using-net-7/)

---

*Document maintained by: Architecture Team*  
*Last updated: January 27, 2026*

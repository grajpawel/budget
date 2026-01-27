# Budget App - Implementation Roadmap

> **Last Updated:** January 27, 2026  
> **Status:** Foundation Complete, Core Features Pending

This document outlines all remaining work needed to complete the Budget App, organized by priority and dependency order.

---

## Table of Contents

1. [Current Status](#current-status)
2. [Phase 1: Infrastructure & DevOps](#phase-1-infrastructure--devops)
3. [Phase 2: Authentication & Authorization](#phase-2-authentication--authorization)
4. [Phase 3: Core Backend Implementation](#phase-3-core-backend-implementation)
5. [Phase 4: Frontend Features](#phase-4-frontend-features)
6. [Phase 5: Data Import & Export](#phase-5-data-import--export)
7. [Phase 6: Premium Features](#phase-6-premium-features)
8. [Phase 7: Testing & Quality](#phase-7-testing--quality)
9. [Phase 8: Production Readiness](#phase-8-production-readiness)
10. [Phase 9: Post-Launch](#phase-9-post-launch)

---

## Current Status

### ✅ Completed

| Component | Status | Notes |
|-----------|--------|-------|
| Project structure | ✅ Done | Monorepo with src/web, src/api, infra |
| React frontend scaffold | ✅ Done | Vite + TypeScript + Tailwind + Shadcn/ui setup |
| ASP.NET Core backend scaffold | ✅ Done | Lambda-ready with controllers/services structure |
| AWS CDK infrastructure | ✅ Done | Stacks for Auth, Database, Storage, API |
| GitHub Actions workflows | ✅ Done | CI, deploy-api, deploy-web |
| Docker Compose local dev | ✅ Done | DynamoDB Local + LocalStack |
| Architecture documentation | ✅ Done | Comprehensive ARCHITECTURE.md |

### 🔄 In Progress / Scaffold Only

| Component | Status | Notes |
|-----------|--------|-------|
| DynamoDB operations | 🔄 Scaffold | Service methods return empty/mock data |
| Authentication flow | 🔄 Scaffold | AuthContext exists but not tested |
| API endpoints | 🔄 Scaffold | Controllers defined, need DynamoDB integration |

### ❌ Not Started

| Component | Status |
|-----------|--------|
| Actual DynamoDB CRUD operations | ❌ |
| Cognito deployment & configuration | ❌ |
| Transaction management features | ❌ |
| Charts & visualizations | ❌ |
| CSV import/export | ❌ |
| Unit & integration tests | ❌ |
| E2E tests | ❌ |

---

## Phase 1: Infrastructure & DevOps

**Priority:** 🔴 Critical  
**Estimated Effort:** 1-2 days

### 1.1 AWS Account Setup

- [ ] Create AWS account (if not exists)
- [ ] Set up IAM user for CDK deployments
- [ ] Configure AWS CLI locally
- [ ] Set up OIDC identity provider for GitHub Actions
- [ ] Create IAM role for GitHub Actions with required permissions

### 1.2 CDK Deployment

- [ ] Bootstrap CDK in target region (`cdk bootstrap`)
- [ ] Deploy Auth stack (Cognito User Pool)
- [ ] Deploy Database stack (DynamoDB table)
- [ ] Deploy Storage stack (S3 bucket)
- [ ] Deploy API stack (Lambda + API Gateway)
- [ ] Verify all stack outputs

### 1.3 GitHub Repository Setup

- [ ] Create GitHub repository
- [ ] Configure repository secrets:
  - `AWS_ROLE_ARN` - OIDC role ARN
  - `COGNITO_USER_POOL_ID`
  - `COGNITO_CLIENT_ID`
  - `API_GATEWAY_URL`
  - `AMPLIFY_APP_ID`
  - `DEPLOY_BUCKET`
- [ ] Set up branch protection rules
- [ ] Configure environment-specific secrets (dev, prod)

### 1.4 Local Development Improvements

- [ ] Create PowerShell script for DynamoDB table setup (replace bash script)
- [ ] Add seed data script for local development
- [ ] Create `.env.example` file for frontend
- [ ] Document local setup in README

---

## Phase 2: Authentication & Authorization

**Priority:** 🔴 Critical  
**Estimated Effort:** 2-3 days

### 2.1 Cognito Configuration

- [ ] Configure hosted UI domain
- [ ] Set up email verification templates
- [ ] Configure password reset flow
- [ ] Add custom attributes (`subscriptionTier`, `displayName`)
- [ ] Set up Pre-Token Generation Lambda trigger (for custom claims)

### 2.2 Frontend Auth Implementation

- [ ] Create registration page (`/register`)
- [ ] Create email verification page (`/verify`)
- [ ] Create forgot password page (`/forgot-password`)
- [ ] Create reset password page (`/reset-password`)
- [ ] Implement "Remember me" functionality
- [ ] Add session refresh logic
- [ ] Handle auth errors gracefully with user-friendly messages
- [ ] Add loading states during auth operations

### 2.3 Backend Auth Validation

- [ ] Verify JWT token validation is working correctly
- [ ] Extract user ID from token claims properly
- [ ] Add subscription tier check middleware
- [ ] Implement rate limiting per user
- [ ] Add request logging with user context

### 2.4 Social Login (Optional - Future)

- [ ] Configure Google OAuth provider in Cognito
- [ ] Configure Apple OAuth provider in Cognito
- [ ] Update frontend to support social login buttons

---

## Phase 3: Core Backend Implementation

**Priority:** 🔴 Critical  
**Estimated Effort:** 5-7 days

### 3.1 DynamoDB Repository Layer

- [ ] Create `IDynamoDbRepository<T>` interface
- [ ] Implement generic repository with:
  - `GetAsync(pk, sk)`
  - `QueryAsync(pk, skPrefix)`
  - `PutAsync(item)`
  - `UpdateAsync(item)`
  - `DeleteAsync(pk, sk)`
  - `BatchWriteAsync(items)`
- [ ] Add pagination support with `LastEvaluatedKey`
- [ ] Implement optimistic locking with version attribute
- [ ] Add retry logic with exponential backoff

### 3.2 User Profile Service

- [ ] Implement `GetProfileAsync` - fetch from DynamoDB
- [ ] Implement `CreateProfileAsync` - create with default categories
- [ ] Implement `UpdateProfileAsync` - partial updates
- [ ] Implement `DeleteProfileAsync` - cascade delete all user data
- [ ] Add profile caching (optional)

### 3.3 Category Service

- [ ] Implement `GetCategoriesAsync` - query all user categories
- [ ] Implement `GetCategoryAsync` - single category fetch
- [ ] Implement `CreateCategoryAsync` - with duplicate name check
- [ ] Implement `UpdateCategoryAsync` - with validation
- [ ] Implement `DeleteCategoryAsync` - check for transaction references
- [ ] Implement `CreateDefaultCategoriesAsync` - batch write defaults
- [ ] Add category icon/color validation

### 3.4 Transaction Service

- [ ] Implement `GetTransactionsAsync` with:
  - Date range filtering
  - Category filtering
  - Search by description
  - Pagination
  - Sorting (date desc by default)
- [ ] Implement `GetTransactionAsync` - single transaction
- [ ] Implement `CreateTransactionAsync`:
  - Validate category exists
  - Apply auto-categorization rules
  - Generate transaction ID
- [ ] Implement `UpdateTransactionAsync` - partial updates
- [ ] Implement `DeleteTransactionAsync`
- [ ] Implement `GetDashboardAsync`:
  - Calculate total balance
  - Sum monthly income/expenses
  - Aggregate spending by category
  - Generate monthly trends (last 6-12 months)

### 3.5 Categorization Rules Service

- [ ] Create `ICategorizationRuleService` interface
- [ ] Implement CRUD operations for rules
- [ ] Implement rule matching engine:
  - Pattern matching (contains, starts with, regex)
  - Priority ordering
  - Case-insensitive matching
- [ ] Apply rules on transaction creation
- [ ] Bulk re-categorize existing transactions

### 3.6 Error Handling & Validation

- [ ] Create global exception handler middleware
- [ ] Implement request validation with FluentValidation
- [ ] Return proper HTTP status codes
- [ ] Add correlation IDs for request tracing
- [ ] Implement problem details (RFC 7807) responses

---

## Phase 4: Frontend Features

**Priority:** 🟡 High  
**Estimated Effort:** 7-10 days

### 4.1 API Integration Layer

- [ ] Create typed API client with interceptors
- [ ] Add request/response logging in dev mode
- [ ] Implement automatic token refresh
- [ ] Add retry logic for failed requests
- [ ] Create React Query hooks for all endpoints:
  - `useProfile`, `useUpdateProfile`
  - `useCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
  - `useTransactions`, `useTransaction`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`
  - `useDashboard`
  - `useRules`, `useCreateRule`, `useUpdateRule`, `useDeleteRule`

### 4.2 Dashboard Page

- [ ] Implement summary cards with real data:
  - Total balance
  - Monthly income
  - Monthly expenses
  - Transaction count
- [ ] Add spending by category pie/donut chart (Recharts)
- [ ] Add monthly trend line chart
- [ ] Add recent transactions list (last 5-10)
- [ ] Add quick action buttons (Add transaction, etc.)
- [ ] Implement date range selector
- [ ] Add loading skeletons

### 4.3 Transactions Page

- [ ] Implement transactions table with:
  - Sortable columns
  - Responsive design (card view on mobile)
  - Row actions (edit, delete)
- [ ] Create Add/Edit Transaction modal/drawer:
  - Date picker
  - Amount input with currency formatting
  - Type toggle (income/expense)
  - Description input
  - Category selector
  - Notes textarea
  - Tags input
- [ ] Implement search functionality
- [ ] Add category filter dropdown
- [ ] Add date range filter
- [ ] Implement infinite scroll or pagination
- [ ] Add bulk actions (delete selected, categorize selected)
- [ ] Add transaction duplication feature

### 4.4 Categories Page

- [ ] Display categories in grid/list view
- [ ] Add Create/Edit Category modal:
  - Name input
  - Color picker
  - Icon selector
  - Type (income/expense)
- [ ] Show transaction count per category
- [ ] Show spending total per category
- [ ] Implement category merging
- [ ] Add drag-and-drop reordering

### 4.5 Categorization Rules Page

- [ ] Create rules management UI
- [ ] Add Create/Edit Rule modal:
  - Pattern input
  - Match type selector (contains, starts with, regex)
  - Category selector
  - Priority input
  - Active toggle
- [ ] Show rule testing interface
- [ ] Implement bulk apply rules button

### 4.6 Settings Page

- [ ] Implement profile update form
- [ ] Add currency preference (with list of common currencies)
- [ ] Add date format preference
- [ ] Add theme toggle (light/dark mode)
- [ ] Implement data export functionality
- [ ] Add account deletion with confirmation
- [ ] Add notification preferences (future)

### 4.7 UI Components (Shadcn/ui)

- [ ] Set up Shadcn/ui CLI
- [ ] Add required components:
  - Button, Input, Select
  - Dialog, Drawer, Sheet
  - Table, DataTable
  - Card
  - Dropdown Menu
  - Toast/Sonner notifications
  - Calendar, Date Picker
  - Tabs
  - Badge
  - Avatar
  - Skeleton
  - Alert

### 4.8 UX Improvements

- [ ] Add form validation with Zod + React Hook Form
- [ ] Implement optimistic updates
- [ ] Add success/error toast notifications
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement keyboard shortcuts
- [ ] Add empty states with helpful messages
- [ ] Add error boundaries

---

## Phase 5: Data Import & Export

**Priority:** 🟡 High  
**Estimated Effort:** 3-4 days

### 5.1 CSV Export

- [ ] Create export endpoint in backend
- [ ] Generate CSV with:
  - All transaction fields
  - Category names (not just IDs)
  - Proper date formatting
- [ ] Add export button in Settings
- [ ] Support date range selection for export
- [ ] Add progress indicator for large exports

### 5.2 CSV Import

- [ ] Design import flow:
  1. Upload file
  2. Preview & map columns
  3. Validate data
  4. Show errors/warnings
  5. Confirm import
  6. Process & show results
- [ ] Create file upload endpoint with S3 presigned URLs
- [ ] Implement CSV parsing in backend
- [ ] Support common bank export formats:
  - Generic CSV
  - Mint format
  - YNAB format
  - Custom mapping
- [ ] Implement duplicate detection
- [ ] Apply categorization rules during import
- [ ] Store import history for rollback

### 5.3 Bank Statement Parsing (Future)

- [ ] Research common bank PDF formats
- [ ] Evaluate OCR/parsing libraries
- [ ] Implement parser for 2-3 major banks

---

## Phase 6: Premium Features

**Priority:** 🟢 Medium  
**Estimated Effort:** 5-7 days

### 6.1 Subscription Tiers

- [ ] Define tier features:
  - **Free:** 100 transactions/month, 5 categories, basic charts
  - **Pro ($5/mo):** Unlimited transactions, unlimited categories, advanced charts, CSV import, API access
- [ ] Implement feature flags based on subscription tier
- [ ] Create upgrade prompts in UI

### 6.2 Payment Integration

- [ ] Integrate Stripe Checkout
- [ ] Create subscription management endpoints
- [ ] Implement Stripe webhooks for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Update Cognito custom attribute on subscription change
- [ ] Create billing portal link

### 6.3 Premium UI Features

- [ ] Create pricing page
- [ ] Add upgrade modal/page
- [ ] Implement feature gating UI:
  - Lock icons on premium features
  - Upgrade prompts when hitting limits
- [ ] Create subscription management page

### 6.4 Step-Up Authentication (Premium)

- [ ] Implement MFA enrollment flow
- [ ] Create step-up auth challenge for sensitive actions:
  - Delete account
  - Export all data
  - Change email
- [ ] Add Cognito Lambda triggers for step-up validation

---

## Phase 7: Testing & Quality

**Priority:** 🟡 High  
**Estimated Effort:** 5-7 days

### 7.1 Backend Unit Tests

- [ ] Set up xUnit test project
- [ ] Add Moq for mocking
- [ ] Write tests for:
  - Transaction service (CRUD, calculations)
  - Category service (CRUD, defaults)
  - Categorization rule engine
  - Dashboard aggregations
- [ ] Aim for 80%+ code coverage

### 7.2 Backend Integration Tests

- [ ] Set up test containers for DynamoDB Local
- [ ] Test API endpoints end-to-end
- [ ] Test authentication flow
- [ ] Test error handling

### 7.3 Frontend Unit Tests

- [ ] Set up Vitest with React Testing Library
- [ ] Test utility functions
- [ ] Test custom hooks
- [ ] Test form validation logic
- [ ] Test component rendering

### 7.4 Frontend Integration Tests

- [ ] Test page components with mocked API
- [ ] Test authentication flow
- [ ] Test navigation

### 7.5 E2E Tests

- [ ] Set up Playwright
- [ ] Write critical path tests:
  - User registration & login
  - Create transaction
  - View dashboard
  - Edit/delete transaction
  - Import CSV
- [ ] Set up visual regression testing (optional)

### 7.6 Code Quality

- [ ] Configure ESLint rules strictly
- [ ] Add Prettier for consistent formatting
- [ ] Add Husky pre-commit hooks
- [ ] Configure SonarQube or CodeClimate
- [ ] Add dependency vulnerability scanning

---

## Phase 8: Production Readiness

**Priority:** 🔴 Critical  
**Estimated Effort:** 3-5 days

### 8.1 Security Hardening

- [ ] Security review of all endpoints
- [ ] Implement request rate limiting (API Gateway)
- [ ] Add WAF rules for common attacks
- [ ] Enable CloudWatch alarms for:
  - Error rate spikes
  - Latency increases
  - 4xx/5xx responses
- [ ] Review IAM permissions (least privilege)
- [ ] Enable DynamoDB encryption at rest
- [ ] Enable S3 bucket policies

### 8.2 Performance Optimization

- [ ] Enable Lambda Provisioned Concurrency (if needed)
- [ ] Optimize DynamoDB queries (projections, filters)
- [ ] Add response caching for static data
- [ ] Optimize frontend bundle size
- [ ] Enable CloudFront caching
- [ ] Add lazy loading for routes

### 8.3 Monitoring & Observability

- [ ] Set up structured logging
- [ ] Configure CloudWatch dashboards
- [ ] Set up X-Ray tracing
- [ ] Create runbooks for common issues
- [ ] Set up PagerDuty/Opsgenie alerts (optional)

### 8.4 Documentation

- [ ] Complete API documentation (OpenAPI/Swagger)
- [ ] Write user guide/help documentation
- [ ] Create FAQ page
- [ ] Document deployment procedures
- [ ] Create incident response procedures

### 8.5 Domain & SSL

- [ ] Register domain name
- [ ] Set up Route 53 hosted zone
- [ ] Request ACM certificate
- [ ] Configure custom domain for:
  - Frontend (Amplify)
  - API Gateway
  - Cognito hosted UI

### 8.6 Compliance (if applicable)

- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Implement GDPR data export
- [ ] Implement GDPR data deletion
- [ ] Add cookie consent banner

---

## Phase 9: Post-Launch

**Priority:** 🟢 Low  
**Estimated Effort:** Ongoing

### 9.1 Analytics & Insights

- [ ] Integrate analytics (Plausible, Mixpanel, etc.)
- [ ] Track key user actions
- [ ] Create conversion funnels
- [ ] Monitor user engagement

### 9.2 User Feedback

- [ ] Add feedback widget
- [ ] Set up user interviews
- [ ] Create feature request board

### 9.3 Feature Enhancements

- [ ] Recurring transactions
- [ ] Budget goals per category
- [ ] Bill reminders
- [ ] Multi-currency support
- [ ] Shared budgets (family)
- [ ] Mobile app (React Native)
- [ ] Browser extension for quick add
- [ ] Bank account syncing (Plaid integration)

### 9.4 Infrastructure Scaling

- [ ] Evaluate multi-region deployment
- [ ] Implement database backups
- [ ] Set up disaster recovery procedures

---

## Appendix: Effort Estimates Summary

| Phase | Estimated Days | Priority |
|-------|----------------|----------|
| Phase 1: Infrastructure & DevOps | 1-2 | 🔴 Critical |
| Phase 2: Authentication | 2-3 | 🔴 Critical |
| Phase 3: Core Backend | 5-7 | 🔴 Critical |
| Phase 4: Frontend Features | 7-10 | 🟡 High |
| Phase 5: Import/Export | 3-4 | 🟡 High |
| Phase 6: Premium Features | 5-7 | 🟢 Medium |
| Phase 7: Testing | 5-7 | 🟡 High |
| Phase 8: Production Readiness | 3-5 | 🔴 Critical |
| **Total (MVP)** | **~25-35 days** | - |
| **Total (with Premium)** | **~35-45 days** | - |

---

## Recommended Implementation Order

### MVP (Minimum Viable Product)
1. Phase 1: Infrastructure setup
2. Phase 2: Authentication
3. Phase 3: Core Backend (3.1-3.4, skip 3.5 rules for MVP)
4. Phase 4: Frontend (4.1-4.3 Dashboard & Transactions)
5. Phase 7: Basic testing (7.1, 7.3)
6. Phase 8: Production readiness (8.1-8.3, 8.5)

### Post-MVP
7. Phase 4: Remaining frontend (Categories, Rules, Settings)
8. Phase 5: Import/Export
9. Phase 6: Premium features
10. Phase 7: Complete testing
11. Phase 9: Ongoing improvements

---

## Notes

- All estimates assume single developer
- Multiply by 0.6-0.7 for team of 2
- Add 20-30% buffer for unexpected issues
- Prioritize based on user feedback after MVP launch

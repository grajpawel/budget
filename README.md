# Budget App

A personal budget management web application built with React, ASP.NET Core, and AWS.

## 🏗️ Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + Shadcn/ui |
| **Backend** | ASP.NET Core 8.0 on AWS Lambda (Native AOT) |
| **Database** | Amazon DynamoDB (single-table design) |
| **Auth** | AWS Cognito |
| **Storage** | Amazon S3 |
| **Infrastructure** | AWS CDK (TypeScript) |
| **CI/CD** | GitHub Actions |

## 📁 Project Structure

```
budget/
├── .github/workflows/     # CI/CD pipelines
├── docs/                  # Architecture & design docs
├── infra/                 # AWS CDK infrastructure
├── scripts/               # Development & deployment scripts
├── src/
│   ├── api/               # ASP.NET Core Lambda backend
│   └── web/               # React frontend
└── docker-compose.yml     # Local development services
```

## 🚀 Getting Started

### Prerequisites

- [Node.js 20.x](https://nodejs.org/)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [AWS CLI v2](https://aws.amazon.com/cli/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)

### Local Development

1. **Start local AWS services:**
   ```bash
   docker-compose up -d
   ```

2. **Set up DynamoDB table:**
   ```bash
   ./scripts/setup-dynamodb.sh
   ```

3. **Start the frontend:**
   ```bash
   cd src/web
   npm install
   npm run dev
   ```

4. **Start the backend:**
   ```bash
   cd src/api
   dotnet watch run
   ```

### Environment Variables

Create a `.env.local` file in `src/web/`:
```env
VITE_AWS_REGION=eu-central-1
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:5000
```

## 🧪 Running Tests

```bash
# Frontend tests
cd src/web && npm test

# Backend tests
cd src/api && dotnet test
```

## 🚢 Deployment

Deployments are automated via GitHub Actions:
- **CI** runs on every push/PR
- **Deploy API** deploys the Lambda backend
- **Deploy Web** deploys the frontend to Amplify

Manual deployment:
```bash
cd infra
npm install
npx cdk deploy --all
```

## 📖 Documentation

- [Architecture Document](docs/ARCHITECTURE.md)
- [Cloud Provider Comparison](docs/CLOUD_PROVIDER_COMPARISON.md)

## 📄 License

Private project - All rights reserved.

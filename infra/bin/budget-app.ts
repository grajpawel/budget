#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
};

const environment = app.node.tryGetContext('environment') || 'dev';

// Auth Stack - Cognito User Pool
const authStack = new AuthStack(app, `Budget-Auth-${environment}`, {
  env,
  environment,
});

// Database Stack - DynamoDB
const databaseStack = new DatabaseStack(app, `Budget-Database-${environment}`, {
  env,
  environment,
});

// Storage Stack - S3
const storageStack = new StorageStack(app, `Budget-Storage-${environment}`, {
  env,
  environment,
});

// API Stack - Lambda + API Gateway
const apiStack = new ApiStack(app, `Budget-Api-${environment}`, {
  env,
  environment,
  userPool: authStack.userPool,
  table: databaseStack.table,
  bucket: storageStack.bucket,
});

// Add dependencies
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);

app.synth();

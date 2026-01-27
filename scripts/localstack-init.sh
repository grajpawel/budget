#!/bin/bash
# LocalStack initialization script
# This script runs when LocalStack is ready

echo "Initializing LocalStack resources..."

# Create S3 bucket for file uploads
awslocal s3 mb s3://budget-uploads-local

# Configure CORS on the bucket
awslocal s3api put-bucket-cors --bucket budget-uploads-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "LocalStack initialization complete!"

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environment: string;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for file uploads
    this.bucket = new s3.Bucket(this, 'BudgetUploadsBucket', {
      bucketName: `budget-uploads-${props.environment}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'prod',
      cors: [
        {
          allowedOrigins: props.environment === 'prod'
            ? ['https://budget.example.com']
            : ['http://localhost:5173'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          // Delete incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          // Transition old uploads to Glacier after 90 days (optional cost saving)
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      exportName: `Budget-BucketName-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      exportName: `Budget-BucketArn-${props.environment}`,
    });
  }
}

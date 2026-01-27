import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

interface ApiStackProps extends cdk.StackProps {
  environment: string;
  userPool: cognito.UserPool;
  table: dynamodb.Table;
  bucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigw.HttpApi;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Determine Lambda code source
    const publishPath = path.join(__dirname, '../../src/api/publish');
    const lambdaCode = fs.existsSync(publishPath)
      ? lambda.Code.fromAsset(publishPath)
      : lambda.Code.fromInline('// Placeholder for CDK synth validation');

    // Lambda Function
    this.lambdaFunction = new lambda.Function(this, 'BudgetApiFunction', {
      functionName: `budget-api-${props.environment}`,
      runtime: fs.existsSync(publishPath) ? lambda.Runtime.DOTNET_8 : lambda.Runtime.NODEJS_20_X,
      handler: fs.existsSync(publishPath) ? 'Budget.Api' : 'index.handler',
      code: lambdaCode,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.X86_64,
      environment: {
        ASPNETCORE_ENVIRONMENT: props.environment === 'prod' ? 'Production' : 'Development',
        Cognito__Region: this.region,
        Cognito__UserPoolId: props.userPool.userPoolId,
        DynamoDB__TableName: props.table.tableName,
        S3__BucketName: props.bucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions
    props.table.grantReadWriteData(this.lambdaFunction);
    props.bucket.grantReadWrite(this.lambdaFunction);

    // Cognito Authorizer
    const authorizer = new apigwAuthorizers.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      props.userPool,
      {
        identitySource: ['$request.header.Authorization'],
      }
    );

    // HTTP API
    this.api = new apigw.HttpApi(this, 'BudgetHttpApi', {
      apiName: `budget-api-${props.environment}`,
      corsPreflight: {
        allowOrigins: props.environment === 'prod'
          ? ['https://budget.example.com']
          : ['http://localhost:5173'],
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.DELETE,
          apigw.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigwIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      this.lambdaFunction
    );

    // Health check route (no auth)
    this.api.addRoutes({
      path: '/health',
      methods: [apigw.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // API routes (with auth)
    this.api.addRoutes({
      path: '/api/{proxy+}',
      methods: [
        apigw.HttpMethod.GET,
        apigw.HttpMethod.POST,
        apigw.HttpMethod.PUT,
        apigw.HttpMethod.DELETE,
      ],
      integration: lambdaIntegration,
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url!,
      exportName: `Budget-ApiUrl-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      exportName: `Budget-LambdaArn-${props.environment}`,
    });
  }
}

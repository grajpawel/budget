import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environment: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // DynamoDB Table - Single Table Design
    this.table = new dynamodb.Table(this, 'BudgetTable', {
      tableName: `BudgetTable-${props.environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand for free tier
      removalPolicy: props.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.environment === 'prod',
    });

    // GSI for alternative access patterns
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      exportName: `Budget-TableName-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      exportName: `Budget-TableArn-${props.environment}`,
    });
  }
}

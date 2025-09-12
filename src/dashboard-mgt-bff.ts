import * as cdk from "aws-cdk-lib"
import * as apigw from "aws-cdk-lib/aws-apigatewayv2"
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations"
import * as ddb from "aws-cdk-lib/aws-dynamodb"
import * as events from "aws-cdk-lib/aws-events"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as levs from "aws-cdk-lib/aws-lambda-event-sources"
import * as ln from "aws-cdk-lib/aws-lambda-nodejs"
import * as logs from "aws-cdk-lib/aws-logs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"
import { ServerlessSpy } from "serverless-spy"

export interface DashboardMgtBffProps extends cdk.StackProps {
  serviceName: string
  stage: string
}

export class DashboardMgtBff extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DashboardMgtBffProps) {
    super(scope, id, props)

    let eventBus: cdk.aws_events.IEventBus
    if (props.stage.startsWith("test")) {
      eventBus = new events.EventBus(this, "EventBus")
    } else {
      eventBus = events.EventBus.fromEventBusArn(
        this,
        "EventBus",
        ssm.StringParameter.valueForStringParameter(
          this,
          `/vimo/${props.stage}/event-bus-arn`,
        ),
      )
    }

    const table = new ddb.TableV2(this, "DashboardMgtBffTable", {
      partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
      sortKey: { name: "SK", type: ddb.AttributeType.STRING },
      dynamoStream: ddb.StreamViewType.NEW_AND_OLD_IMAGES,
      billing: ddb.Billing.onDemand(),
      removalPolicy:
        props.stage === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    })

    const trigger = new ln.NodejsFunction(this, "Trigger", {
      entry: `${__dirname}/functions/trigger.ts`,
      environment: {
        STAGE: props.stage,
        SERVICE: props.serviceName,
        TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.THREE_DAYS,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      events: [
        new levs.DynamoEventSource(table, {
          startingPosition: lambda.StartingPosition.TRIM_HORIZON,
          retryAttempts: 3,
        }),
      ],
    })
    table.grantReadWriteData(trigger)
    eventBus.grantPutEventsTo(trigger)

    const api = new apigw.HttpApi(this, "DashboardMgtBffApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
      },
    })
    const apiFunction = new ln.NodejsFunction(this, "ApiFunction", {
      entry: `${__dirname}/functions/api/index.ts`,
      environment: {
        STAGE: props.stage,
        SERVICE: props.serviceName,
        NODE_OPTIONS: "--enable-source-maps",
        TABLE_NAME: table.tableName,
      },
      bundling: { minify: true, sourceMap: true },
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      logRetention: logs.RetentionDays.THREE_DAYS,
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    })
    table.grantReadWriteData(apiFunction)

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url ?? "",
    })
    new cdk.CfnOutput(this, "EventBusName", {
      value: eventBus.eventBusName,
    })

    const apiIntegration = new integrations.HttpLambdaIntegration(
      "ApiIntegration",
      apiFunction,
    )
    api.addRoutes({
      path: "/{proxy+}",
      methods: [apigw.HttpMethod.ANY],
      integration: apiIntegration,
      // authorizer: undefined, // TODO: add later
    })

    if (props.stage.startsWith("test")) {
      const serverlessSpy = new ServerlessSpy(this, "ServerlessSpy", {
        generateSpyEventsFileLocation: "test/spy.ts",
      })
      serverlessSpy.spy()
    }
  }
}

import { Projalf } from "projalf"

const project = new Projalf({
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  name: "dashboard-mgt-bff",
  projenrcTs: true,

  watchIncludes: ["src/**/*.ts", "src/**/*.tsx"],

  deps: [
    "@aws-lambda-powertools/logger",
    "@aws-lambda-powertools/tracer",

    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-eventbridge",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/util-dynamodb",

    "aws-cdk-lib",
    "aws-lambda",

    "dynamodb-toolbox",
    "zod",
    "hono",
    "@hono/zod-openapi",
    "@hono/swagger-ui",
    "@middy/core",
    "serverless-spy",
    "date-fns",
    "uuid",
    "vimo-events@latest",
  ],
  devDeps: ["projalf@0.0.23", "@faker-js/faker@8", "exponential-backoff"],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
})

project.synth()

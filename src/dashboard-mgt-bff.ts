import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"

export interface DashboardMgtBffProps extends cdk.StackProps {
  serviceName: string;
  stage: string;
}

export class DashboardMgtBff extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DashboardMgtBffProps) {
    super(scope, id, props)
    // Add your infra here...
  }
}

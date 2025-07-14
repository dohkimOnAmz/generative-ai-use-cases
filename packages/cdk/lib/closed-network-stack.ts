import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ProcessedStackInput } from './stack-input';
import { ClosedVpc, TestEnvironment, ClosedWeb } from './construct';

export interface ClosedNetworkStackProps extends StackProps {
  readonly params: ProcessedStackInput;
}

export class ClosedNetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly apiGatewayVpcEndpoints: ec2.InterfaceVpcEndpoint[] = [];
  public readonly webBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ClosedNetworkStackProps) {
    super(scope, id, props);

    const {
      closedNetworkAppIpv4Cidr,
      closedNetworkUserIpv4Cidr,
      closedNetworkCertificateArn,
      closedNetworkDomainName,
      closedNetwrokCreateTestEnvironment,
    } = props.params;

    const closedVpc = new ClosedVpc(this, 'ClosedVpc', {
      ipv4Cidr: closedNetworkAppIpv4Cidr,
      userIpv4Cidr: closedNetworkUserIpv4Cidr,
      domainName: closedNetworkDomainName,
    });

    this.apiGatewayVpcEndpoints.push(closedVpc.apiGatewayVpcEndpoint);

    let testEnvironment: TestEnvironment | undefined = undefined;

    if (closedNetwrokCreateTestEnvironment) {
      testEnvironment = new TestEnvironment(this, 'TestEnvironment', {
        vpc: closedVpc.vpc,
        ipv4Cidr: closedNetworkUserIpv4Cidr,
        hostedZone: closedVpc.hostedZone,
      });

      this.apiGatewayVpcEndpoints.push(testEnvironment.apiGatewayVpcEndpoint);
    }

    const closedWeb = new ClosedWeb(this, 'ClosedWeb', {
      vpc: closedVpc.vpc,
      hostedZone: closedVpc?.hostedZone,
      certificateArn: closedNetworkCertificateArn,
    });

    this.vpc = closedVpc.vpc;
    this.webBucket = closedWeb.bucket;

    const webUrl =
      closedVpc?.hostedZone && closedNetworkCertificateArn
        ? `https://${closedVpc.hostedZone.zoneName}`
        : `http://${closedWeb.alb.loadBalancerDnsName}`;

    new CfnOutput(this, 'WebUrl', {
      value: webUrl,
    });
  }
}

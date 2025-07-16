import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as agw from 'aws-cdk-lib/aws-apigateway';
import { ProcessedStackInput } from './stack-input';
import {
  ClosedVpc,
  ClosedWeb,
  CognitoPrivateProxy,
  WindowsRdp,
} from './construct';

export interface ClosedNetworkStackProps extends StackProps {
  readonly params: ProcessedStackInput;
}

export class ClosedNetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly apiGatewayVpcEndpoint: ec2.InterfaceVpcEndpoint;
  public readonly webBucket: s3.Bucket;
  public readonly cognitoUserPoolProxyApi: agw.RestApi;
  public readonly cognitoIdPoolProxyApi: agw.RestApi;

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

    const closedWeb = new ClosedWeb(this, 'ClosedWeb', {
      vpc: closedVpc.vpc,
      hostedZone: closedVpc?.hostedZone,
      certificateArn: closedNetworkCertificateArn,
    });

    const cognitoPrivateProxy = new CognitoPrivateProxy(
      this,
      'CognitoPrivateProxy',
      {
        vpcEndpoint: closedVpc.apiGatewayVpcEndpoint,
      }
    );

    const webUrl =
      closedVpc?.hostedZone && closedNetworkCertificateArn
        ? `https://${closedVpc.hostedZone.zoneName}`
        : `http://${closedWeb.alb.loadBalancerDnsName}`;

    if (closedNetwrokCreateTestEnvironment) {
      new WindowsRdp(this, 'WindowsRdp', {
        vpc: closedVpc.vpc,
      });
    }

    new CfnOutput(this, 'WebUrl', {
      value: webUrl,
    });

    this.vpc = closedVpc.vpc;
    this.webBucket = closedWeb.bucket;
    this.apiGatewayVpcEndpoint = closedVpc.apiGatewayVpcEndpoint;
    this.cognitoUserPoolProxyApi = cognitoPrivateProxy.cognitoUserPoolProxyApi;
    this.cognitoIdPoolProxyApi = cognitoPrivateProxy.cognitoIdPoolProxyApi;
  }
}

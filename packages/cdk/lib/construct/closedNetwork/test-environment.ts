import { Construct } from 'constructs';
import { WindowsRdp } from './windows-rdp';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { PrivateHostedZone } from 'aws-cdk-lib/aws-route53';

export interface TestEnvironmentProps {
  readonly vpc: ec2.Vpc;
  readonly ipv4Cidr: string;
  readonly hostedZone?: PrivateHostedZone;
}

export class TestEnvironment extends Construct {
  public readonly apiGatewayVpcEndpoint: ec2.InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: TestEnvironmentProps) {
    super(scope, id);

    const testEnvironmentVpc = new ec2.Vpc(this, 'testEnvironmentVpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.ipv4Cidr),
      maxAzs: 2,
    });

    const peer = new ec2.CfnVPCPeeringConnection(this, 'Peer', {
      peerVpcId: props.vpc.vpcId,
      vpcId: testEnvironmentVpc.vpcId,
    });

    testEnvironmentVpc.privateSubnets.map(
      (subnet: ec2.ISubnet, idx: number) => {
        new ec2.CfnRoute(this, `PeerRouteTestEnvironment${idx}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: props.vpc.vpcCidrBlock,
          vpcPeeringConnectionId: peer.ref,
        });
      }
    );

    props.vpc.isolatedSubnets.map((subnet: ec2.ISubnet, idx: number) => {
      new ec2.CfnRoute(this, `PeerRouteVpc${idx}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: testEnvironmentVpc.vpcCidrBlock,
        vpcPeeringConnectionId: peer.ref,
      });
    });

    const windowsRdp = new WindowsRdp(this, 'WindowsRdp', {
      vpc: testEnvironmentVpc,
    });

    if (props.hostedZone) {
      props.hostedZone.addVpc(testEnvironmentVpc);
    }

    this.apiGatewayVpcEndpoint = windowsRdp.apiGatewayVpcEndpoint;
  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

const USER_SIDE_VPC_ENDPOINTS: Record<
  string,
  ec2.InterfaceVpcEndpointAwsService
> = {
  ApiGateway: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
  Lambda: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
  AppSync: ec2.InterfaceVpcEndpointAwsService.APP_SYNC,
  Transcribe: ec2.InterfaceVpcEndpointAwsService.TRANSCRIBE,
  TranscribeStreaming: ec2.InterfaceVpcEndpointAwsService.TRANSCRIBE_STREAMING,
  Polly: ec2.InterfaceVpcEndpointAwsService.POLLY,
};

export interface WindowsRdpProps {
  readonly vpc: ec2.Vpc;
}

export class WindowsRdp extends Construct {
  public readonly apiGatewayVpcEndpoint: ec2.InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: WindowsRdpProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const keyPair = new ec2.CfnKeyPair(this, 'KeyPair', {
      keyName: 'windows-key-pair',
    });

    new cdk.CfnOutput(this, 'GetSSMKeyCommand', {
      value: `aws ssm get-parameter --name /ec2/keypair/${keyPair.getAtt(
        'KeyPairId'
      )} --region ${
        region
      } --with-decryption --query Parameter.Value --output text`,
    });

    const sg = new ec2.SecurityGroup(this, 'WindowsSg', {
      vpc: props.vpc,
    });

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389));

    const role = new iam.Role(this, 'WindowsRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    new ec2.Instance(this, 'windowsInstance', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: sg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.MEMORY6_INTEL,
        ec2.InstanceSize.LARGE
      ),
      machineImage: ec2.MachineImage.latestWindows(
        ec2.WindowsVersion.WINDOWS_SERVER_2025_ENGLISH_FULL_BASE
      ),
      keyName: cdk.Token.asString(keyPair.ref),
      instanceProfile: new iam.InstanceProfile(this, 'InstanceProfile', {
        role,
      }),
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(100, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(
      this,
      'UserSideVpcEndpointSecurityGroup',
      {
        vpc: props.vpc,
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(443)
    );

    for (const [name, service] of Object.entries(USER_SIDE_VPC_ENDPOINTS)) {
      const vpcEndpoint = new ec2.InterfaceVpcEndpoint(
        this,
        `VpcEndpoint${name}`,
        {
          vpc: props.vpc,
          service,
          subnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroups: [securityGroup],
          privateDnsEnabled: true,
        }
      );

      if (name === 'ApiGateway') {
        this.apiGatewayVpcEndpoint = vpcEndpoint;
      }
    }
  }
}

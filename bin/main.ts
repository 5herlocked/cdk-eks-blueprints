#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as blueprints from '../lib';
import {KubernetesManifest, KubernetesVersion, NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import {AuroraClusterProvider} from "../lib/resource-providers/rds";
import {AuroraPostgresEngineVersion, DatabaseClusterEngine} from "aws-cdk-lib/aws-rds";
import {ClusterAddOn, GlobalResources, VpcProvider} from "../lib";
// import BlueprintConstruct from '../examples/blueprint-construct';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props = {env: {account, region}};

// new BlueprintConstruct(app, props);

const clusterProvider = new blueprints.GenericClusterProvider({
  version: KubernetesVersion.V1_24,

  managedNodeGroups: [
    {
      id: "mng1",
      amiType: NodegroupAmiType.AL2_X86_64,
      instanceTypes: [new ec2.InstanceType('m5a.large')],
      desiredSize: 1,
      maxSize: 2,
      nodeGroupSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS}
    }
  ]
});

const addOns: Array<ClusterAddOn> = [
  new blueprints.addons.ExternalDnsAddOn({
    hostedZoneResources: [
      GlobalResources.HostedZone
    ]
  }),
  new blueprints.addons.AwsLoadBalancerControllerAddOn(),
  new blueprints.addons.ExternalsSecretsAddOn(),
  new blueprints.addons.BackstageAddOn(),
];

const dbInstanceProvider = new AuroraClusterProvider({
  auroraEngine: DatabaseClusterEngine.auroraPostgres(
    {
      version: AuroraPostgresEngineVersion.VER_14_6
    },
  ),
  name: "backstageRds"
});

const clusterBlueprint = blueprints.EksBlueprint.builder()
  .resourceProvider("HostedZone", new blueprints.ImportHostedZoneProvider('Z09914292UPR9DOR1B1Z2'))
  .resourceProvider(blueprints.GlobalResources.Vpc, new VpcProvider(undefined, "20.0.0.0/16", ["20.0.1.0/24", "20.0.2.0/24", "20.0.3.0/24"]))
  .resourceProvider(blueprints.GlobalResources.Rds, dbInstanceProvider)
  .clusterProvider(clusterProvider)
  .addOns(...addOns)
  .build(app, 'backstage-cluster-test', props);

const clusterStore = new KubernetesManifest(app, 'cluster-store', {
  cluster: clusterBlueprint.getClusterInfo().cluster,
  manifest: [
    {
      apiVersion: "external-secrets.io/v1beta1",
      kind: "ClusterSecretStore",
      metadata: {name: "default"},
      spec: {
        provider: {
          aws: {
            service: "SecretsManager",
            region: region,
            auth: {
              jwt: {
                serviceAccountRef: {
                  name: "external-secrets-sa",
                  namespace: "external-secrets",
                },
              },
            },
          },
        },
      },
    },
  ]
});

const rdsSecrets = new KubernetesManifest(app, 'rds-secret-inject', {
  cluster: clusterBlueprint.getClusterInfo().cluster,
  manifest: [
    {
      apiVersion: "external-secrets.io/v1beta1",
      kind: "ExternalSecret",
      metadata: {name: "rds-secret-name"},
      spec: {
        secretStoreRef: {
          name: "default",
          kind: "ClusterSecretStore",
        },
        target: {
          name: "backstage-db-secrets",
          creationPolicy: "Merge",
        },
        data: [
          {
            secretKey: "secret-key-to-be-managed",
            remoteRef: {
              key: "the-providers-secret-name",
              property: "the-provider-secret-property",
            },
          },
        ],
      },
    }
  ]
});

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as blueprints from '../lib';
import {KubernetesVersion, NodegroupAmiType} from "aws-cdk-lib/aws-eks";
import {AuroraClusterProvider} from "../lib/resource-providers/rds";
import {AuroraPostgresEngineVersion, DatabaseClusterEngine} from "aws-cdk-lib/aws-rds";
import {VpcProvider} from "../lib";
// import BlueprintConstruct from '../examples/blueprint-construct';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props = { env: { account, region } };

// new BlueprintConstruct(app, props);

const clusterProvider = new blueprints.GenericClusterProvider({
  version: KubernetesVersion.V1_24,

  managedNodeGroups: [
    {
      id: "mng1",
      amiType: NodegroupAmiType.AL2_X86_64,
      instanceTypes: [ new ec2.InstanceType('m5a.large') ],
      desiredSize: 1,
      maxSize: 2,
      nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    }
  ]
});

blueprints.EksBlueprint.builder()
  .resourceProvider(blueprints.GlobalResources.Vpc, new VpcProvider(undefined, "20.0.0.0/16", ["20.0.1.0/24","20.0.2.0/24","20.0.3.0/24"]))
  .resourceProvider(blueprints.GlobalResources.Rds, new AuroraClusterProvider({
    auroraEngine: DatabaseClusterEngine.auroraPostgres(
      { version: AuroraPostgresEngineVersion.VER_14_6 }
    ),
    name: "auroraRds"
  }))
  .clusterProvider(clusterProvider)
  .build(app, 'resourceProvider-test', props);

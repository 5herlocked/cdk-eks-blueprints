import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { CapacityType, KubernetesVersion } from 'aws-cdk-lib/aws-eks';

// TODO: Update this test to actually reflect
test("Accepts relatively complex BackstageConfigMaps", async () => {
    const app = new cdk.App();


});

test("Actually creates and deploys a backstage instance", () => {
    const app = new cdk.App();

    const clusterProvider = blueprints.clusterBuilder().build();

    const blueprint =  blueprints.EksBlueprint.builder()
        .account('123456789').region('us-east-1')
        .clusterProvider(clusterProvider)
        .addOns(new blueprints.BackstageAddOn)
        .build(app, 'stack-with-with-backstage-add-on');

    // TODO: Fill these expectations out
    expect().toBe();
});

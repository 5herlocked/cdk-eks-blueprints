import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { CapacityType, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import {BackstageAddOnProps} from "../lib";

// TODO: Update this test to actually reflect
test("Accepts relatively complex BackstageConfigMaps", async () => {
    const app = new cdk.App();

    const clusterProvider = blueprints.clusterBuilder().build();

    const backstageProps :BackstageAddOnProps = {
        backstage: {
            image: {
                repository: 'public.ecr.aws/a0m0j3q7/backstage-tester',
                tag: 'latest',
            }
        },

        postgres: {
            enabled: true,
        }
    };

    const backstageAddOn = new blueprints.BackstageAddOn(backstageProps);

    const blueprint =  blueprints.EksBlueprint.builder()
        .account('123456789').region('us-east-1')
        .clusterProvider(clusterProvider)
        .addOns(new blueprints.EbsCsiDriverAddOn(), backstageAddOn)
        .build(app, 'stack-with-complex-backstage-add-on');

});

test("Actually creates and deploys a backstage instance", () => {
    const app = new cdk.App();

    const clusterProvider = blueprints.clusterBuilder().build();

    const backstageProps :BackstageAddOnProps = {
        backstage: {
            image: {
                repository: 'public.ecr.aws/a0m0j3q7/backstage-tester',
                tag: 'latest',
            }
        },

        postgres: {
            enabled: true,
        }
    };

    const backstageAddOn = new blueprints.BackstageAddOn(backstageProps);

    const blueprint =  blueprints.EksBlueprint.builder()
        .account('123456789').region('us-east-1')
        .clusterProvider(clusterProvider)
        .addOns(new blueprints.EbsCsiDriverAddOn(), backstageAddOn)
        .build(app, 'stack-with-backstage-add-on');

    // TODO: Fill these expectations out
    expect(blueprint).toBeDefined();
});

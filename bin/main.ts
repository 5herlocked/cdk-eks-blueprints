#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import * as blueprints from "../lib";
import {BackstageAddOnProps} from "../lib";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props = { env: { account, region } };

const clusterProvider = blueprints.clusterBuilder().build();

const backstageProps: BackstageAddOnProps = {
    baseUrl: 'backstage.unicorn-rentals.io',
    ingressProps: {
        enabled: true
    },
    postgresProps: {
        enabled: true
    },
};

const backstageAddOn = new blueprints.BackstageAddOn(backstageProps);

const blueprint =  blueprints.EksBlueprint.builder()
    .account(props.env.account).region(props.env.region)
    .clusterProvider(clusterProvider)
    .addOns(new blueprints.EbsCsiDriverAddOn(), backstageAddOn)
    .build(app, 'stack-with-complex-backstage-add-on');

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import * as blueprints from "../lib";
import {BackstageAddOnProps} from "../lib";
import BlueprintConstruct from '../examples/blueprint-construct';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const props = { env: { account, region } };

const clusterProvider = blueprints.clusterBuilder().build();

const backstageProps: BackstageAddOnProps = {
    backstage: {
        appConfig: undefined,
        args: [],
        command: [],
        containerPorts: [],
        containerSecurityContext: undefined,
        extraAppConfig: [],
        extraContainers: [],
        extraEnvVars: [],
        extraEnvVarsSecrets: [],
        extraVolumeMounts: [],
        extraVolumes: [],
        image: {
            debug: true,
            pullPolicy: "",
            pullSecrets: [],
            registry: "",
            repository: "",
            tag: ""
        },
        initContainers: [],
        podSecurityContext: undefined,
        resources: undefined

    },
    diagnosticMode: {
        args: [], command: [], enabled: true

    },
    global: {
        imagePullSecrets: [], imageRegistry: ""

    },
    ingress: {
        annotations: undefined,
        className: "",
        enabled: true,
        host: "",
        tls: {
            enabled: true,
            secretName: ""
        }
    },
    postgres: undefined

};

const backstageAddOn = new blueprints.BackstageAddOn(backstageProps);

const blueprint =  blueprints.EksBlueprint.builder()
    .account(props.env.account).region(props.env.region)
    .clusterProvider(clusterProvider)
    .addOns(new blueprints.EbsCsiDriverAddOn(), backstageAddOn)
    .build(app, 'stack-with-complex-backstage-add-on');

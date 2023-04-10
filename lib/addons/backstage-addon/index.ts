import merge from "ts-deepmerge";
import {Construct} from "constructs";
import {ClusterInfo, Values} from "../../spi";
import {dependable} from "../../utils";
import {HelmAddOn, HelmAddOnProps, HelmAddOnUserProps} from "../helm-addon";

/**
 * Configuration options for the add-on as listed in
 * https://github.com/backstage/charts
 */
export interface BackstageAddOnProps extends HelmAddOnUserProps {
    backstage?: BackstageProps,

    diagnosticMode?: DiagnosticProps,

    global?: GlobalProps,

    ingress?: IngressProps,

    metrics?: MetricsProps,

    networkPolicy?: NetworkProps,

    postgres?: PostgresProps,

    service?: ServiceProps,

    serviceAccount?: ServiceAccountProps,

    clusterDomain?: string,
    commonAnnotations?: string,
    commonLabels?: string,
    extraDeploy?: string,
    fullNameOverride?: string,
    kubeVersion?: string,
    nameOverride?: string,

}

export interface BackstageProps {
    annotations?: {
        [key: string]: string
    },

    appConfig?: {
        [key: string]: string
    },

    args?: string[],

    command?: string[],

    containerPorts?: {
        [key: string]: string
    },

    containerSecurityContext?: any,

    extraAppConfig?: string[],
    extraContainers?: string[],
    extraEnvVars?: string[],
    extraEnvVarsSecrets?: string[],
    extraVolumes?: string[],

    image?: {
        debug?: boolean,
        pullPolicy?: string,
        pullSecrets?: string[],
        registry?: string,
        repository?: string,
        tag?: string
    }

    initContainers?: string[],
    installDir?: string,

    nodeSelector?: {
        [key: string]: string
    },

    podAnnotations?: {
        [key: string]: string
    },

    podSecurityContext?: {
        [key: string]: string
    },

    replicas?: number,

    resources?: {
        [key: string]: string
    },

    tolerations?: string[]
}

export interface DiagnosticProps {
    args?: string[],
    command?: string[],
    enabled?: boolean,
}

export interface GlobalProps {
    imagePullSecrets?: string[],
    imageRegistry?: string,
}

export interface IngressProps {
    annotations?: {
        [key: string]: string
    },

    className?: string,
    enabled?: boolean,
    host?: string,

    tls?: {
        enabled: boolean,
        secretName: string,
    }
}

export interface MetricsProps {
    serviceMonitor?: {
        annotations?: {
            [key: string]: string
        },

        enabled?: boolean,
        interval?: string,

        labels?: {
            [key: string]: string
        },

        path?: string,
    }
}

export interface NetworkProps {
    egressRules?: {
        customRules?: string[],
    },

    enabled?: boolean,
}

export interface PostgresProps {
    architecture?: "standalone" | "replication",

    auth?: {
        existingSecret?: string,
        password?: string,

        secretKeys?: {
            adminPasswordKey?: string,
            replicationPasswordKey?: string,
            userPasswordKey?: string
        },

        username?: string,
    }

    enabled?: boolean
}

export interface ServiceProps {
    annotations?: {
        [key: string]: string
    },

    clusterIp?: string,
    externalTrafficPolicy?: string,
    extraPorts?: string[],
    loadBalancerIp?: string,
    loadBalancerSourceRanges?: string[],

    nodePorts?: {
        [key: string]: string
    },

    ports?: {
        name: string,
        targetPort: string,
        sessionAffinity?: string,
    },

    type: string
}

export interface ServiceAccountProps {
    annotations?: {
        [key: string]: string
    },

    automountServiceAccountToken?: boolean,
    create?: boolean,

    labels?: {
        [key: string]: string
    },

    name?: string,
}

const defaultProps: HelmAddOnProps & BackstageAddOnProps = {
    // Helm AddOnProps
    name: 'backstage-addon',
    namespace: 'backstage',
    version: '0.21.0',
    chart: 'backstage',
    //TODO: Verify these default props and ensure they work with the new repoitory
    repository: 'https://backstage.github.io/charts',
    release: 'blueprints-addon-backstage',
    values: {},
    backstage: {
        containerPorts: {
            "backend": "7007",
        },
        image: {
            debug: false,
            registry: "ghcr.io",
            repository: "backstage/backstage",
            tag: "latest"
        },
        installDir: "/app"
    },
    clusterDomain: "cluster.local",
    diagnosticMode: {
        enabled: false,
    },
    ingress: {
        enabled: false
    },
    metrics: {
        serviceMonitor: {
            enabled: false,
        }
    },
    networkPolicy: {
        enabled: false,
    },
    postgres: {
        enabled: false
    },
    service: {
        nodePorts: {
            "backend": "7007"
        },
        ports: {
            name: "http-backend",
            targetPort: "backend",
            sessionAffinity: "None"
        },
        type: "ClusterIP"
    }
};

export class BackstageAddOn extends HelmAddOn {

    readonly options: BackstageAddOnProps;

    constructor(props: BackstageAddOnProps) {
        super({...defaultProps, ...props });
        this.options = this.props as BackstageAddOnProps;
    }

    @dependable('EbsCsiDriverAddOn')
    deploy(clusterInfo: ClusterInfo): Promise<Construct> {
        let values = populateValues(this.options);

        values = merge(values, this.props.values ?? {});
        // Create Helm Chart
        const backstageHelmChart = this.addHelmChart(clusterInfo, values, true, true);

        return Promise.resolve(backstageHelmChart);
    }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions: BackstageAddOnProps): Values {
    // Configure Postgres
    // setPath(values, 'postegresql.enabled', true);

    return helmOptions.values ?? {};
}
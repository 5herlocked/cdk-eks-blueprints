import { ClusterInfo } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
import {KubernetesSecret} from "../secrets-store/csi-driver-provider-aws-secrets";

/**
 * Configuration options for the add-on as listed in
 * https://github.com/vinzscam/backstage-chart 
 */

export interface BackstageAddOnVars {
    name: string,
    value: string,
}

export interface BackstageExtraConfigMap {
    // in the manifest file, this directly accepts yaml files
    // we need a way to ingest a file, convert it to a "config map" object
    // then merge it with the final manifest
    reference: string,

}

export interface BackstageAddOnProps extends HelmAddOnUserProps {

    /**
     * Override Kubernetes version
     * @default "" 
     */
    kubeVersion?: string;

    /**
     * String to partially override common.names.fullname
     * @default "" 
     */
    nameOverride?: string;

    /**
     * String to fully override common.names.fullname
     * @default ""
     */
    fullnameOverride?: string;

    /**
     * Default Kubernetes cluster domain
     * @default cluster.local 
     */
    clusterDomain?: string;

    /**
     * Labels to add to all deployed objects
     * @default {}
     */
    commonLabels?: any;

    /**
     * Annotations to add to all deployed objects
     * @default {}
     */
    commonAnnotations?: any;

    /**
     * Array of extra objects to deploy with the release
     * @default []
     */
    extraDeploy?: string[];

    /**
     * Paramaters to define diagnostic mode
     */
    diagnosticMode?: {
        /**
         * Enable diagnostic mode (all probes will be disabled
         * and the command will be overriden)
         * @default false 
         */
        enabled: boolean,
        /**
         * Command to override all containers in the stateful set
         * @default ["sleep"]
         */
        command: string[],
        /**
         * Args to override all containers in the stateful set
         * @default ["infinity"]
         */
        args: string[]
    }

    /**
     * Sets certain global parameters
     */
    global?: {
        /**
         * Global Docker image registry
         * @default ""
         */
        imageRegistry: string,
        /**
         * Global Docker registry secret names as an array
         * @default []
         */
        imagePullSecrets: KubernetesSecret[],
        /**
         * Global StorageClass for Persistent Volume(s)
         * @default ""
         */
        storageClass: string,
    };

    /**
     * Parameters passed to Backstage
     */
    backstage?: {
        /**
         * Parameters for Backstage images
         */
        image?: {
            /**
             * Backstage image registry
             * @default ""
             */
            registry?: string,
            /**
             * Backstage image repository (required)
             * @default ""
             */
            repository: string,
            /**
             * Backstage image tag (required immutable tags are recommended)
             * @default ""
             */
            tag: string,
            /**
             * Backstage image pull policy
             * @default IfNotPresent
             */
            pullPolicy: string,
            /**
             * Specify docker-registry secret names as an array
             * @default []
             */
            pullSecrets: string[],
        },
        /**
         * Override Backstage container command
         * @default ["node", "packages/backend"]
         */
        command?: string[],
        /**
         * Override Backstage container arguments
         * @default ["--config", "app-config.yaml", "--config", "app-config-production.yaml"]
         */
        args?: string[],
        /**
         * Extra environment variables to add to Backstage pods
         */
        extraEnvVars?: BackstageAddOnVars[],
        /**
         * ConfigMap with extra environment variables
         */
        extraAppConfig?: BackstageExtraConfigMap[],
        /**
         * Array of existing secrets containing sensitive environment variables
         */
        extraEnvVarsSecrets?: KubernetesSecret[],
    };

    /**
     * Parameters defining how ingress is setup for the backstage service
     */
    ingress?: {
        /**
         * Enable ingress
         * @default false
         */
        enabled: boolean,
        /**
         * Name of the IngressClass cluster resource
         * @default ""
         */
        className: string,
        /**
         * Additional annotations for the Ingress resource
         * @default {}
         */
        annotations?: any,
        /**
         * Hostname of the backstage application (e.g backstage.nip.io)
         * @default ""
         */
        host: "",
    };

    service?: {
        /**
         * Kubernetes Service type
         * @default ClusterIP
         */
        type: string,
        /**
         * Control where client request go, to the same pod or round-robin
         * @default None
         */
        sessionAffinity: string,
        /**
         * Backstage service Cluster IP
         * @default ""
         */
        clusterIP: string,
        /**
         * Backstage service Load Balancer IP
         * @default ""
         */
        loadBalancerIP: string,
        /**
         * Backstage service load balancer sources
         * @default []
         */
        loadBalancerSourceRanges: string[],
        /**
         * Backstage service external traffic policy
         * @default Cluster
         */
        externalTrafficPolicy: string,
        /**
         * Additional custom annotations for Backstage service
         * @default {}
         */
        annotations: any,
        /**
         * Extra ports to expose in Backstage
         * @default []
         */
        extraPorts: string[],

        ports: {
            /**
             * Port for client connections
             * @default 7007
             */
            backend: string,
        }

        nodePorts: {
            /**
             * Node port for client connections
             * @default ""
             */
            backend: string
        }
    }
}

const defaultProps: HelmAddOnProps & BackstageAddOnProps = {
    // Helm AddOnProps
    name: 'backstage-addon',
    namespace: 'kube-system',
    version: '0.3.1',
    chart: 'backstage-chart',
    repository: 'https://vinzscam.github.io/',
    release: 'blueprints-addon-backstage',
    values: {},

    // Backstage AddOnProps
    // Currently set to the defaults recommended by the helm chart
    clusterDomain: "cluster.local",
    diagnosticMode: {
        enabled: false,
        command: ["sleep"],
        args: ["infinity"]
    },

    backstage: {
        image: {
            registry: "",
            repository: "",
            tag: "",
            pullPolicy: "IfNotPresent",
            pullSecrets: [],
        },
        command: ["node", "packages/backend"],
        args: ["--config", "app-config.yaml", "--config", "app-config-production.yaml"],
    },

    ingress: {
        enabled: false,
        className: "",
        host: "",
    },

    service: {
        type: "ClusterIP",
        ports: {
            backend: "7007",
        },
        nodePorts: {
            backend: ""
        },
        sessionAffinity: "None",
        clusterIP: "",
        loadBalancerIP: "",
        loadBalancerSourceRanges: [],
        externalTrafficPolicy: "Cluster",
        annotations: {},
        extraPorts: []
    }
    /**
     * TODO: Finish testing for deployment verification and "good" common-sense defaults for the deployment
     */
};

export class BackstageAddOn extends HelmAddOn {

    private options: BackstageAddOnProps;

    constructor(props?: BackstageAddOnProps) {
        super({...defaultProps, ...props });
        this.options = this.props as BackstageAddOnProps;
    }

    deploy(clusterInfo: ClusterInfo): void {
        const cluster = clusterInfo.cluster;

        let values = this.options.values ?? {};

        // Create persistent storage with EBS
        const storageClass = this.options.global?.storageClass || "";
        
    }
}
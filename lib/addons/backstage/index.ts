import { ClusterInfo } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";

/**
 * Configuration options for the add-on as listed in
 * https://github.com/vinzscam/backstage-chart 
 */

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
    extraDeploy?: [];

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
        command: [],
        /**
         * Args to override all containers in the stateful set
         * @default ["infinity"]
         */
        args: []
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
        imagePullSecrets: string,
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
            registery?: string,
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
            pullSecerts: [],
        },
        /**
         * Override Backstage container command
         * @default ["node", "packages/backend"]
         */
        command?: [],
        /**
         * Override Backstage container arguments
         * @default ["--config", "app-config.yaml", "--config", "app-config-production.yaml"]
         */
        args?: [],
        /**
         * Extra environment variables to add to Backstage pods
         */
        extraEnvVars?: [],
        /**
         * ConfigMap with extra environment variables
         */
        extraAppConfig?: [],
        /**
         * Array of existing secrets containing sensitive environment variables
         */
        extraEnvVarsSecrets?: [],
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
        loadBalancerSourceRanges: [],
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
        extraPorts: [],

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
    
};

export class BackstageAddOn extends HelmAddOn {

    private options: BackstageAddOnProps;

    constructor(props?: BackstageAddOnProps) {
        super({...defaultProps, ...props });
        this.options = this.props as BackstageAddOnProps;
    }

    deploy(clusterInfo: ClusterInfo): void {

    }
}
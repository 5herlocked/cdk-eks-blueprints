import merge from "ts-deepmerge";
import { Construct } from "constructs";
import { ClusterInfo, Values } from "../../spi";
import { dependable, setPath} from "../../utils";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
import { KubernetesSecret } from "../secrets-store/csi-driver-provider-aws-secrets";

/**
 * Configuration options for the add-on as listed in
 * https://github.com/vinzscam/backstage-chart
 * Pivoting to use the redhat chart for backstage-deployment
 * https://github.com/redhat-developer/helm-backstage/tree/main/charts/backstage
 */

export interface IngressProps {
    /**
     * Class Name for ingress service
     * @default ""
     */
    className?: string,

    /**
     * Is access to the backstage instance enabled?
     * @default true
     */
    enabled: boolean,

    /**
     * TLS Ingress secret Name
     * @default ""
     */
    secretName?: string,
}

export interface PostgresExternalProps {

    enabled: false,

    /**
     * HostName for Postgres database
     * @default ""
     */
    databaseHost: string,

    /**
     * Name of the database
     * @default "postgres"
     */
    databaseName: string,
    
    /**
     * Password of external database
     * @default ""
     */
    databasePassword: KubernetesSecret,

    /**
     * Port to use for external db
     * @default 5432
     */
    databasePort: number,

    /**
     * Name to use for database user
     * @default "postgres"
     */
    databaseUser: string,

    /**
     * Secret to be used for existing database
     * @default ""
     */
    existingSecret: KubernetesSecret,
}

export interface PostgresInternalProps {

    enabled: true,

    /**
     * CPU limit given to postgres instance
     * @default "400m"
     */
    cpuLimit?: string,

    /**
     * Memory Limit given to postgres instance
     * @default "596Mi"
     */
    memoryLimit?: string,

    /**
     * Initial compute power requested by postgres instance
     * @default "100m"
     */
    cpuRequest?: string,

    /**
     * Initial memory space requested by postgres instance
     * @default "128Mi"
     */
    memoryRequest?: string,

    /**
     * Admin password to be used by the postgres instance
     * @default ""
     */
    adminKey?: KubernetesSecret,

    /**
     * Annotations to be applied to the service account
     * @default {}
     */
    serviceAccountAnnotations?: any,

    /**
     * Name given to the postgres service account
     * @default ""
     */
    serviceAccountName?: string,

    /**
     * Storage assigned to the postgres production
     * @default "2Gi"
     */
    storageSize?: string,
}

export interface BackstageAddOnProps extends HelmAddOnUserProps {
    /**
     * URL used to access the backstage user interface
     * assigned-to: backstage.baseUrl
     * @default ""
     * @required
     */
    baseUrl: string,

    /**
     * Yaml file defining all the components
     * TODO: Later define this as a transaparent CRD for backstage Components
     * assigned-to: backstage.catalog.location[0].type
     * @default "https://github.com/backstage/backstage/blob/master/packages/catalog-model/examples/all-components.yaml" 
     */
    catalogYaml?: string,

    /**
     * Defines Backstage image pullpolicy
     * assigned-to: image.pullPolicy
     * @default "Always"
     */
    pullPolicy?: string,

    /**
     * Defines the Backstage image refistry
     * assigned-to: image.registry
     * @default "ghcr.io"
     */
    registry?: string,

    /**
     * Defines the backstage repository to pull from
     * assigned-to: image.repository
     * @default "redhat-developer/redhat-backstage-build"
     */
    repository?: string,

    /**
     * Defines the image version/tag to use
     * assigned-to: image.version
     * @default "latest"
     */
    version?: string,

    /**
     * Secrets to be used for pulling images
     * assigned-to: imagePullSecrets
     * @default []
     */
    imagePullSecrets?: KubernetesSecret[],

    /**
     * Properties used for ingress
     */
    ingressProps?: IngressProps,

    /**
     * Properties used to deploy a postgres instance
     * Props for external deployment included
     */
    postgresProps?: PostgresInternalProps | PostgresExternalProps,

    /**
     * Number of replicas to be created by backstage
     * @default 1
     */
    replicas?: number,

    /**
     * TODO: Figure out WTF this means
     */
    securityContext?: any,

    /**
     * Serivce Port for backstage deployment
     * assigned-to: service.port
     * @default 8080
     */
    servicePort?: number,

    /**
     * Target port for backstage deployment
     * assigned-to: service.targetPort
     * @default 7007
     */
    targetPort?: number,

    /**
     * Serivce type definition
     * assigned-to: service.type
     * @default "ClusterIP"
     */
    type?: string
    
    /**
     * Annotations to be applied to the service account
     * assigned-to: serviceAccount.annotations
     * @default {}
     */
    serviceAccountAnnotations?: any,

    /**
     * Name given to the backstage service account
     * assigned-to: serviceAccount.name
     * @default ""
     */
    serviceAccountName?: string,
}

const defaultProps: HelmAddOnProps & BackstageAddOnProps = {
    // Helm AddOnProps
    name: 'backstage-addon',
    namespace: 'backstage',
    version: 'latest',
    chart: 'redhat-developer-backstage/backstage',
    repository: 'https://redhat-developer.github.io/helm-backstage',
    release: 'blueprints-addon-backstage',
    values: {},

    baseUrl: '',

    postgresProps: {
        enabled: true,
    }
    
    /**
     * TODO: Finish testing for deployment verification and "good" common-sense defaults for the deployment
     */
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
        const backstageHelmChart = this.addHelmChart(clusterInfo, values, false, true);

        return Promise.resolve(backstageHelmChart);
    }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions: BackstageAddOnProps): Values {
    let values = helmOptions.values ?? {};

    // Backstage Parameters setup
    const backstageImageRepo = helmOptions.registry;
    const backstageImageTag = helmOptions.version;
    setPath(values, 'backstage.image.repository', backstageImageRepo);
    setPath(values, 'backstage.image.tag', backstageImageTag);

    // Configure Postgres
    const postgresProps = helmOptions.postgresProps;
    if (postgresProps?.enabled) {
        setPath(values, 'postgres.storage.size', postgresProps.storageSize);
        setPath(values, 'postgres.storage.enabled', true);
    }

    return values;
}
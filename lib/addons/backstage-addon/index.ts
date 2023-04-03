import merge from "ts-deepmerge";
import { Construct } from "constructs";
import { ClusterInfo, Values } from "../../spi";
import { dependable, setPath} from "../../utils";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
import { KubernetesSecret } from "../secrets-store/csi-driver-provider-aws-secrets";
import { bool } from "aws-sdk/clients/signer";

/**
 * Configuration options for the add-on as listed in
 * https://github.com/backstage/charts
 */
export interface BackstageAddOnProps extends HelmAddOnUserProps {
    /**
     * Properties pertaining to Backstage
     * Defaults described below
     */
    backstage?: BackstageProps,

    clusterDomain?: "",
    
    commonAnnotations?: any,

    commonLabels?: any,

    diagnosticMode?: BackstageDiagnosticProps,

    extraDeploy?: [],

    fullNameOverride?: "",

    global?: GlobalProps,

    ingress?: IngressProps,

    kubeVersion?: "",

    nameOverride?: "",

    networkPolicy?: NetworkPolicyProps,

    postgres?: PostgresProps,

/*    service?: ServiceProps,

    serviceAccount?: ServiceAccountProps,*/

}

export interface BackstageProps {
    appConfig?: any,
    
    args?: [],

    command: [],

    containerPorts: [],

    containerSecurityContext?: any,

    extraAppConfig?: [],
    
    extraContainers?: [],

    extraEnvVars?: [],

    extraEnvVarsSecrets?: [],

    extraVolumeMounts?: [],

    extraVolumes?: [],

    image: {
        debug: bool,

        pullPolicy: "",

        pullSecrets: [],

        registry: "",

        repository: "",

        tag: "",
    },

    initContainers?: [],

    podSecurityContext?: any,

    resources?: any
}

export interface BackstageDiagnosticProps {
    enabled: bool,

    args?: [],

    command?: [],
}

export interface GlobalProps {
    imagePullSecrets?: [],

    imageRegistry?: "",
}

export interface IngressProps {
    enabled: bool,

    annotations?: any,
    
    className?: "",

    host?: "",

    tls?: IngressTLSProps,
}

export interface IngressTLSProps {
    enabled: bool,

    secretName: ""
}

export interface NetworkPolicyProps {
    enabled: bool,

    egressRules?: EgressRulesProps,
}

export interface EgressRulesProps {
    customRules?: [],
}

export interface PostgresProps {
    architecture: "standalone" | "replication",

    auth?: PostgresAuthProps,
}

export interface PostgresAuthProps {
    existingSecret?: "",

    password?: KubernetesSecret,

    //TODO: Finish the rest of these props
}

const defaultProps: HelmAddOnProps & BackstageAddOnProps = {
    // Helm AddOnProps
    name: 'backstage-addon',
    namespace: 'backstage',
    version: '0.1.3',
    chart: 'backstage',
    //TODO: Verify these default props and ensure they work with the new repoitory
    repository: 'https://redhat-developer.github.io/helm-backstage',
    release: 'blueprints-addon-backstage',
    values: {},

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
        const backstageHelmChart = this.addHelmChart(clusterInfo, values, true, true);

        return Promise.resolve(backstageHelmChart);
    }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions: BackstageAddOnProps): Values {
    let values = helmOptions.values ?? {};

    // Configure Postgres
    // setPath(values, 'postegresql.enabled', true);

    // Set Route.Enabled to false because it relies on OpenShift constructs
    setPath(values, 'route.enabled', false);

    return values;
}
import { Construct } from 'constructs';
import { HelmAddOn, HelmAddOnUserProps } from "../helm-addon";
import { dependable, setPath } from "../../utils";
import {ClusterInfo, GlobalResources, Values} from "../../spi";
import * as rds from "aws-cdk-lib/aws-rds";
import {
    BackstageProps, DiagnosticProps, GlobalProps,
    IngressProps, NetworkProps, MetricsProps,
    PostgresProps, ServiceProps, ServiceAccountProps
} from "./backstage-values";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {EksBlueprint} from "../../stacks";
import {KubernetesManifest} from "aws-cdk-lib/aws-eks";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {data} from "aws-cdk/lib/logging";
import {SecretValue} from "aws-cdk-lib";

/**
 * User provided options for the Helm Chart
 */
export interface BackstageAddOnProps extends HelmAddOnUserProps {
    version?: string,
    name?: string,
    createNamespace?: boolean,
    namespace?: string,
    subdomain: string,
    certificateResourceName: string,
    imageRegistry: string,
    imageRepository: string,
    imageTag?: string,
    baseUrl: string,
    databaseSecretArn: string,

    values: {
        backstage: BackstageProps,
        diagnosticMode: DiagnosticProps,
        global: GlobalProps,
        ingress: IngressProps,
        metrics: MetricsProps,
        postgres: PostgresProps,
        networkPolicy: NetworkProps,
        service: ServiceProps,
        serviceAccount: ServiceAccountProps,
    }
}

/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
  name: "blueprints-backstage-addon",
  namespace: "backstage-addon",
  chart: "backstage-addon",
  version: "0.17.0",
  release: "backstage-addon",
  repository:  "https://backstage.github.io/charts",
  imageTag: "latest",
  postgresPort: 5432,
  postgresUser: "postgres",
  values: {}
};

/**
 * Main class to instantiate the Helm chart
 */
export class BackstageAddOn extends HelmAddOn {

  readonly options: BackstageAddOnProps;

  constructor(props?: BackstageAddOnProps) {
    super({...defaultProps, ...props});
    this.options = this.props as BackstageAddOnProps;
  }

  @dependable('AwsLoadBalancerControllerAddOn')
  @dependable('ExternalSecretsAddOn')
  deploy(clusterInfo: ClusterInfo): Promise<Construct> {
    let values: Values = populateValues(clusterInfo, this.options);
    const chart = this.addHelmChart(clusterInfo, values);

    return Promise.resolve(chart);
  }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param clusterInfo
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(clusterInfo: ClusterInfo, helmOptions: BackstageAddOnProps): Values {
  const values = helmOptions.values ?? {};

  const annotations = {
    "alb.ingress.kubernetes.io/scheme": "internet-facing",
    "alb.ingress.kubernetes.io/target-type": "ip",
    "alb.ingress.kubernetes.io/certificate-arn": clusterInfo.getResource<ICertificate>(helmOptions.certificateResourceName)?.certificateArn
  };

  const databaseSecrets = clusterInfo.getResource<ISecret>(helmOptions.databaseSecretArn)?.secretValue;

  const context = clusterInfo.getResourceContext();
  const db = context.get(GlobalResources.Rds) as rds.DatabaseCluster;

  let database: { client: string; connection: { password: any; port: any; host: any; user: any } };

  if (databaseSecrets == undefined && db == undefined) {
    throw new Error("Please define either a pre-existing databaseSecretArn or an RDS ResourceProvider");
  } else if (databaseSecrets != undefined) {
    // database Secrets manually defined
    const secrets = databaseSecrets.toJSON();

    database = {
      "client": "pg",
      "connection": {
        "host": secrets.host,
        "port": secrets.port,
        "user": secrets.user,
        "password": secrets.password,
      }
    };

    setPath(values, "backstage-addon.appConfig.backend.database", database);
  } else {
    // database defined with resource provider
    const secrets = db.secret?.secretValue;

    if (secrets == undefined) {
      throw new Error("The database resource provider didn't define a secret.");
    }
    const jsonSecrets = secrets.toJSON();

    database = {
      "client": "pg",
      "connection": {
        "host": jsonSecrets.host,
        "port": jsonSecrets.port,
        "user": jsonSecrets.user,
        "password": jsonSecrets.password,
      }
    };

    setPath(values, "backstage-addon.appConfig.backend.database", database);
  }

  setPath(values, "ingress.enabled", true);
  setPath(values, "ingress.className", "alb");
  setPath(values, "ingress.host", helmOptions.subdomain);
  setPath(values, "ingress.annotations", annotations);

  setPath(values, "backstage-addon.image.registry", helmOptions.imageRegistry);
  setPath(values, "backstage-addon.image.repository", helmOptions.imageRepository);
  setPath(values, "backstage-addon.image.tag", helmOptions.imageTag);

  setPath(values, "backstage-addon.appConfig.app.baseUrl", helmOptions.baseUrl);
  setPath(values, "backstage-addon.appConfig.backend.baseUrl", helmOptions.baseUrl);

  setPath(values, "backstage-addon.command", ["node", "packages/backend", "--config", "app-config.yaml"]);

  return values;
}

import * as path from "node:path";

import type { StackAsset, StackDeployment } from "aws-cdk-lib/pipelines";
import type { Construct } from "constructs";
import { Job, type JobProps, RunStep, actions } from "github-actions-cdk";
import type { AwsCredentialsProvider } from "./aws-credentials";
import { PublishAssetScriptGenerator } from "./private/assets";
import type { StageOptions } from "./wave";

const CDKOUT_ARTIFACT = "cdk.out";

/**
 * Configuration properties for defining a job in the pipeline.
 *
 * @remarks
 * `PipelineJobProps` allows for specifying the AWS credentials provider, any version overrides for actions,
 * and the CDK output directory used within the pipeline job.
 */
export interface PipelineJobProps extends JobProps {
  /**
   * Provider for AWS credentials to be used within this job.
   *
   * @remarks
   * This enables the job to authenticate and interact with AWS resources.
   */
  readonly awsCredentials: AwsCredentialsProvider;

  /**
   * Optional version overrides for specific GitHub Actions.
   *
   * @remarks
   * Provides a way to specify custom versions (or SHA values) for GitHub Actions, allowing for precise control
   * over which versions are used in the workflow.
   */
  readonly versionOverrides?: Record<string, string>;

  /**
   * Directory path where CDK output files are located.
   *
   * @remarks
   * Specifies the folder that contains synthesized output files from AWS CDK. This path is used by the pipeline
   * job to locate and utilize CDK artifacts in subsequent workflow steps.
   */
  readonly cdkoutDir: string;
}

/**
 * Represents a job within the pipeline that requires AWS credentials and CDK output.
 *
 * @remarks
 * The `PipelineJob` class extends the `Job` class and includes specific properties and methods for managing
 * AWS authentication, CDK output references, and version control for GitHub Actions used in the pipeline.
 */
export class PipelineJob extends Job {
  /** AWS credentials provider associated with this job. */
  public readonly awsCredentials: AwsCredentialsProvider;

  /** Specific version overrides for GitHub Actions, if any are provided. */
  public readonly versionOverrides: Record<string, string>;

  /** Directory containing the CDK output files for this job. */
  public readonly cdkoutDir: string;

  /**
   * Constructs a new instance of `PipelineJob`.
   *
   * @param scope - The scope in which to define this job construct.
   * @param id - Unique identifier for this job within the workflow.
   * @param props - Properties for configuring the pipeline job.
   */
  constructor(scope: Construct, id: string, props: PipelineJobProps) {
    super(scope, id, props);

    this.awsCredentials = props.awsCredentials;
    this.versionOverrides = props.versionOverrides ?? {};
    this.cdkoutDir = props.cdkoutDir;
  }

  /**
   * Looks up the version override for a given action identifier, if available.
   *
   * @param actionIdentifier - The identifier of the GitHub Action to retrieve the version for.
   * @returns The overridden version (or SHA) for the action, if specified; otherwise, `undefined`.
   */
  public lookupVersion(actionIdentifier: string): string | undefined {
    return this.versionOverrides[actionIdentifier] ?? undefined;
  }
}

/**
 * Interface for defining a phase of job steps in the pipeline.
 */
export interface IJobPhase {
  /**
   * Defines the steps to be executed for this job phase.
   *
   * @param job - The pipeline job in which to add the steps.
   */
  steps(job: PipelineJob): void;
}

/**
 * Properties for a synthetic pipeline job, including build phases and commands.
 */
export interface SynthPipelineJobProps extends PipelineJobProps {
  /**
   * Optional pre-build phase steps.
   */
  readonly preBuild?: IJobPhase;

  /**
   * Optional post-build phase steps.
   */
  readonly postBuild?: IJobPhase;

  /**
   * Commands to run for installation before the build.
   */
  readonly installCommands?: string[];

  /**
   * Commands to run for the build.
   */
  readonly commands: string[];
}

/**
 * A job that synthesizes the CloudFormation template using CDK.
 */
export class SynthPipelineJob extends PipelineJob {
  constructor(scope: Construct, id: string, props: SynthPipelineJobProps) {
    super(scope, id, props);

    new actions.CheckoutV4(this, "checkout", {
      name: "Checkout",
      version: this.lookupVersion(actions.CheckoutV4.IDENTIFIER),
    });

    if (props.preBuild) props.preBuild.steps(this);

    if (props.installCommands && props.installCommands.length > 0) {
      new RunStep(this, "install", {
        name: "Install",
        run: props.installCommands,
      });
    }

    new RunStep(this, "build", {
      name: "Build",
      run: props.commands,
    });

    if (props.postBuild) props.postBuild.steps(this);

    new actions.UploadArtifactV4(this, "upload", {
      name: `Upload ${CDKOUT_ARTIFACT}`,
      artifactName: CDKOUT_ARTIFACT,
      path: props.cdkoutDir,
      includeHiddenFiles: true,
      version: this.lookupVersion(actions.UploadArtifactV4.IDENTIFIER),
    });
  }
}

/**
 * Properties for a publish pipeline job.
 *
 * @remarks
 * This interface defines the configuration options for a publish job in the pipeline,
 * including the stack assets that need to be published, their corresponding hash mappings,
 * and the optional version of the CDK CLI to use.
 */
export interface PublishPipelineJobProps extends PipelineJobProps {
  /**
   * The stack assets to be published.
   *
   * @remarks
   * This is an array of `StackAsset` objects that represent the resources
   * in the AWS CDK application that need to be published to AWS. Each asset should
   * be included to ensure they are correctly managed and deployed.
   */
  readonly assets: StackAsset[];

  /**
   * A mapping of asset identifiers to their corresponding output expressions.
   *
   * @remarks
   * This map is used to track the outputs of each asset publish step,
   * where the keys are asset identifiers, and the values are the output
   * expressions that reference the published asset hashes in the GitHub Actions
   * workflow. This enables downstream jobs in the pipeline to access the published
   * asset information as needed.
   */
  readonly assetHashMap: Record<string, string>;

  /**
   * Optional version of the CDK CLI to use for publishing.
   *
   * @remarks
   * If provided, this version will be used to run the publish commands.
   * If omitted, the latest installed version of the CDK CLI will be used.
   * Specifying a version can help prevent compatibility issues when deploying
   * assets, especially in environments with multiple CDK versions.
   */
  readonly cdkCliVersion?: string;
}

/**
 * A job that publishes stack assets to AWS.
 *
 * @remarks
 * The `PublishPipelineJob` class handles the process of publishing assets to AWS.
 * It defines the steps required to download artifacts, install necessary dependencies,
 * and execute the publish command for each asset. The job integrates with AWS
 * credentials for secure authentication and provides hooks for outputting asset hashes.
 */
export class PublishPipelineJob extends PipelineJob {
  /**
   * Constructs a new instance of `PublishPipelineJob`.
   *
   * @param scope - The parent construct scope.
   * @param id - Unique identifier for this publish job.
   * @param props - Configuration properties for the publish job.
   *
   * @remarks
   * The constructor initializes the publish job by setting up the necessary steps
   * to download artifacts, install dependencies, and publish assets. It iterates
   * through each asset and creates the appropriate publish steps.
   */
  constructor(scope: Construct, id: string, props: PublishPipelineJobProps) {
    super(scope, id, props);

    // Download artifact step
    new actions.DownloadArtifactV4(this, "DownloadArtifact", {
      name: `Download ${CDKOUT_ARTIFACT}`,
      artifactName: CDKOUT_ARTIFACT,
      path: props.cdkoutDir,
      version: this.lookupVersion(actions.DownloadArtifactV4.IDENTIFIER),
    });

    // Install CDK assets
    const installSuffix = props.cdkCliVersion ? `@${props.cdkCliVersion}` : "";
    new RunStep(this, "install", {
      name: "Install",
      run: `npm install --no-save cdk-assets${installSuffix}`,
    });

    // AWS credentials configuration
    props.awsCredentials.credentialSteps(this, "us-east-1");

    const scriptGen = new PublishAssetScriptGenerator(props.cdkoutDir, props.assets);

    // Write script to cdk.out directory
    const scriptFilename = path.join(props.cdkoutDir, `publish-assets-${id}.sh`);
    scriptGen.writePublishScript(scriptFilename);

    const publishStep = new RunStep(this, "publish", {
      name: `Publish ${id}`,
      run: `/bin/bash ${props.cdkoutDir}/${posixPath(path.relative(props.cdkoutDir, scriptFilename))}`,
    });

    scriptGen.assetIdMap.forEach((outputName, hash) => {
      props.assetHashMap[hash] = `\${{ needs.${this.id}.outputs.${outputName} }}`;
      this.addOutput(outputName, publishStep.outputExpression(outputName));
    });
  }
}

/**
 * Options for the deployment of a stack.
 */
export interface StackOptions {
  /**
   * The GitHub environment for the stack deployment.
   */
  readonly environment: StageOptions["gitHubEnvironment"];

  /**
   * The capabilities for the stack deployment.
   */
  readonly capabilities: StageOptions["stackCapabilities"];
}

/**
 * Properties for a deployment pipeline job.
 *
 * @remarks
 * This interface defines the configuration options required for a deployment job
 * in the pipeline. It includes the CloudFormation stack to be deployed, a mapping
 * of asset hashes for use in the stack template, and optional stack-specific options.
 */
export interface DeployPipelineJobProps extends PipelineJobProps {
  /**
   * The stack to be deployed.
   *
   * @remarks
   * This property represents the `StackDeployment` object which contains metadata
   * about the CloudFormation stack. It must specify properties such as the stack name,
   * region, and the URL of the CloudFormation template to be used for deployment.
   */
  readonly stack: StackDeployment;

  /**
   * A mapping of asset identifiers to their corresponding output expressions.
   *
   * @remarks
   * This map is used to replace asset hash placeholders in the CloudFormation template
   * with the actual asset values at deployment time. The keys are asset identifiers,
   * and the values are the output expressions derived from the publishing steps.
   */
  readonly assetHashMap: Record<string, string>;

  /**
   * Optional stack-specific options.
   *
   * @remarks
   * These options can include capabilities, tags, and other settings specific to
   * the deployment of the stack. Providing these options allows for customization
   * of the deployment process, such as enabling IAM capabilities or specifying tags.
   */
  readonly stackOptions?: StackOptions;
}

/**
 * A job that deploys a CloudFormation stack.
 *
 * @remarks
 * The `DeployPipelineJob` class is responsible for executing the deployment of a
 * specified CloudFormation stack. It integrates with AWS credentials for authentication
 * and ensures that the stack is deployed with the correct template and asset replacements.
 * The job will throw errors if required properties are not provided, ensuring
 * robustness in the deployment process.
 */
export class DeployPipelineJob extends PipelineJob {
  /**
   * Constructs a new instance of `DeployPipelineJob`.
   *
   * @param scope - The parent construct scope.
   * @param id - Unique identifier for this deployment job.
   * @param props - Configuration properties for the deployment job.
   *
   * @remarks
   * The constructor validates required properties for the stack and sets up the
   * necessary steps to deploy the CloudFormation stack using the provided asset hash
   * mappings and options. It initializes the deployment action with AWS CloudFormation.
   */
  constructor(scope: Construct, id: string, props: DeployPipelineJobProps) {
    super(scope, id, props);

    // Validate required properties
    if (!props.stack.region) {
      throw new Error('"region" is required');
    }

    if (!props.stack.templateUrl) {
      throw new Error(`unable to determine template URL for stack ${props.stack.stackArtifactId}`);
    }

    // Configure AWS credentials for deployment
    props.awsCredentials.credentialSteps(this, props.stack.region, props.stack.assumeRoleArn);

    // Function to replace asset hash in the template
    const replaceAssetHash = (template: string) => {
      const hash = path.parse(template.split("/").pop() ?? "").name;
      if (props.assetHashMap[hash] === undefined) {
        throw new Error(`Template asset hash ${hash} not found.`);
      }
      return template.replace(hash, props.assetHashMap[hash]);
    };

    // Create the CloudFormation deployment action
    new actions.AwsCloudFormationGitHubDeployV1(this, "deploy", {
      stackName: props.stack.stackName,
      template: replaceAssetHash(props.stack.templateUrl),
      noFailOnEmptyChangeset: "1",
      roleArn: props.stack.executionRoleArn,
      capabilities: props.stackOptions?.capabilities?.join(","),
      version: this.lookupVersion(actions.AwsCloudFormationGitHubDeployV1.IDENTIFIER),
    });
  }
}

/**
 * Properties for a stage pipeline job.
 */
export interface StagePipelineJobProps extends PipelineJobProps {
  /**
   * The phase that defines the steps to execute in this job.
   */
  readonly phase: IJobPhase;
}

/**
 * A job that executes a specific phase of steps in the pipeline.
 */
export class StagePipelineJob extends PipelineJob {
  constructor(scope: Construct, id: string, props: StagePipelineJobProps) {
    super(scope, id, props);
    props.phase.steps(this);
  }
}

/**
 * Converts a Windows or POSIX path to a POSIX path format.
 *
 * @param windowsOrPosixPath - The input path in either Windows or POSIX format.
 * @returns The normalized POSIX path.
 */
function posixPath(windowsOrPosixPath: string): string {
  return windowsOrPosixPath.split(path.sep).join(path.posix.sep);
}

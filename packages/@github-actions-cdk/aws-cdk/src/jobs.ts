import * as fs from "node:fs";
import * as path from "node:path";

import type { StackAsset, StackDeployment } from "aws-cdk-lib/pipelines";
import type { Construct } from "constructs";
import { Job, type JobProps, RunStep, actions } from "github-actions-cdk";
import type { AwsCredentialsProvider } from "./aws-credentials";
import type { StageOptions } from "./wave";

const ASSET_HASH_NAME = "asset-hash";
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
 */
export interface PublishPipelineJobProps extends PipelineJobProps {
  /**
   * The stack assets to be published.
   */
  readonly assets: StackAsset[];

  /**
   * Optional version of the CDK CLI to use for publishing.
   */
  readonly cdkCliVersion?: string;
}

/**
 * A job that publishes stack assets to AWS.
 */
export class PublishPipelineJob extends PipelineJob {
  constructor(scope: Construct, id: string, props: PublishPipelineJobProps) {
    super(scope, id, props);

    new actions.DownloadArtifactV4(this, "DownloadArtifact", {
      name: `Download ${CDKOUT_ARTIFACT}`,
      artifactName: CDKOUT_ARTIFACT,
      path: props.cdkoutDir,
      version: this.lookupVersion(actions.DownloadArtifactV4.IDENTIFIER),
    });

    const installSuffix = props.cdkCliVersion ? `@${props.cdkCliVersion}` : "";

    new RunStep(this, "install", {
      name: "Install",
      run: `npm install --no-save cdk-assets${installSuffix}`,
    });

    props.awsCredentials.credentialSteps(this, "eu-central-1");

    const { assetId, assetManifestPath } = props.assets[0];

    const relativeToAssembly = (p: string) =>
      posixPath(path.join(props.cdkoutDir, path.relative(path.resolve(props.cdkoutDir), p)));

    const fileContents: string[] = ["set -ex"].concat(
      props.assets.map((asset) => {
        return `npx cdk-assets --path "${relativeToAssembly(asset.assetManifestPath)}" --verbose publish "${asset.assetSelector}"`;
      }),
    );

    fileContents.push(`echo '${ASSET_HASH_NAME}=${assetId}' >> $GITHUB_OUTPUT`);

    const publishStepFile = posixPath(
      path.join(path.dirname(relativeToAssembly(assetManifestPath)), `publish-${id}-step.sh`),
    );

    fs.mkdirSync(path.dirname(publishStepFile), { recursive: true });
    fs.writeFileSync(publishStepFile, fileContents.join("\n"), { encoding: "utf-8" });

    const publishStep = new RunStep(this, "publish", {
      name: `Publish ${id}`,
      run: `/bin/bash ./cdk.out/${posixPath(path.relative(props.cdkoutDir, publishStepFile))}`,
    });

    this.addOutput(ASSET_HASH_NAME, publishStep.outputExpression(ASSET_HASH_NAME));
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
 */
export interface DeployPipelineJobProps extends PipelineJobProps {
  /**
   * The stack to be deployed.
   */
  readonly stack: StackDeployment;

  /**
   * Optional stack-specific options.
   */
  readonly stackOptions?: StackOptions;
}

/**
 * A job that deploys a CloudFormation stack.
 */
export class DeployPipelineJob extends PipelineJob {
  constructor(scope: Construct, id: string, props: DeployPipelineJobProps) {
    super(scope, id, props);

    if (!props.stack.region) {
      throw new Error('"region" is required');
    }

    if (!props.stack.templateUrl) {
      throw new Error(`unable to determine template URL for stack ${props.stack.stackArtifactId}`);
    }

    props.awsCredentials.credentialSteps(this, props.stack.region, props.stack.assumeRoleArn);

    new actions.AwsCloudFormationGitHubDeployV1(this, "deploy", {
      stackName: props.stack.stackName,
      template: props.stack.templateUrl,
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

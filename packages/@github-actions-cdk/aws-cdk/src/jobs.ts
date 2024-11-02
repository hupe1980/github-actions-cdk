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
 * Properties for configuring a pipeline job.
 */
export interface PipelineJobProps extends JobProps {
  /**
   * The provider for AWS credentials to be used within this job.
   */
  readonly awsCredentials: AwsCredentialsProvider;

  /**
   * The directory where the CDK output files are located.
   */
  readonly cdkoutDir: string;
}

/**
 * Represents a job in the pipeline that requires AWS credentials and CDK output.
 */
export class PipelineJob extends Job {
  public readonly awsCredentials: AwsCredentialsProvider;
  public readonly cdkoutDir: string;

  /**
   * Constructs a new instance of `PipelineJob`.
   *
   * @param scope - The scope in which this job is defined.
   * @param id - The unique identifier for this job.
   * @param props - The properties for the pipeline job.
   */
  constructor(scope: Construct, id: string, props: PipelineJobProps) {
    super(scope, id, props);

    this.awsCredentials = props.awsCredentials;
    this.cdkoutDir = props.cdkoutDir;
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

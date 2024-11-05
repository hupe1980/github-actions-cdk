import { Stack, Stage } from "aws-cdk-lib";
import { PipelineBase, type StackDeployment, type StageDeployment } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import type {
  ConcurrencyOptions,
  ContainerOptions,
  JobProps,
  WorkflowProps,
} from "github-actions-cdk";
import { AwsCdkAdapter } from "./adapter";
import type { AwsCredentialsProvider } from "./aws-credentials";
import type { DockerCredentials } from "./docker-credentials";
import type { StackOptions } from "./jobs";
import type { Synth } from "./steps";
import { GitHubWave, type IWaveStageAdder, type StageOptions, type WaveOptions } from "./wave";
import { type JobSettings, type PipelinePhases, PipelineWorkflow } from "./workflow";

/**
 * Properties for configuring a GitHub Actions-based deployment pipeline.
 *
 * @remarks
 * `GitHubActionsPipelineProps` enables configuration of the GitHub Actions workflow
 * for a CDK pipeline, including defining the workflow environment, AWS credentials,
 * Docker registry credentials, job phases, and version overrides for specific actions.
 * It also provides options for setting workflow file paths, naming conventions, and
 * a synthesizer for the CDK application.
 */
export interface GitHubActionsPipelineProps extends PipelinePhases {
  /**
   * Optional name for the GitHub Actions workflow.
   *
   * @default "Deploy"
   */
  readonly workflowName?: string;

  /**
   * Directory path where workflow YAML files will be generated.
   *
   * @default ".github/workflows"
   */
  readonly workflowOutdir?: string;

  /**
   * Name of the generated workflow file (without extension).
   *
   * @default "deploy"
   */
  readonly workflowFilename?: string;

  /**
   * Environment variables to be included in the workflow.
   *
   * @remarks
   * This allows setting custom environment variables for jobs within the workflow,
   * which may be useful for configuration or runtime settings that the jobs rely on.
   */
  readonly workflowEnv?: Record<string, string>;

  /**
   * Configuration for concurrency control of workflow runs.
   */
  readonly concurrency?: WorkflowProps["concurrency"];

  /**
   * Optional configuration settings for individual jobs within the pipeline.
   *
   * @remarks
   * `JobSettings` allow fine-tuning of job-specific behavior, including conditions and
   * environment configurations that are applied to individual jobs in the pipeline.
   */
  readonly jobSettings?: JobSettings;

  /**
   * Enables a single publishing job per asset type within the workflow.
   *
   * @remarks
   * When set to `true`, this option consolidates publishing jobs by asset type
   * (e.g., Docker images, file assets), which can reduce redundant jobs and streamline
   * the workflow, especially in pipelines with multiple assets of the same type.
   *
   * @default false
   */
  readonly singlePublisherPerAssetType?: boolean;

  /**
   * AWS credentials provider for actions requiring AWS authentication.
   *
   * @remarks
   * This provider supplies AWS credentials (e.g., access keys) for actions that
   * interact with AWS services. The provider should implement `AwsCredentialsProvider`.
   */
  readonly awsCredentials: AwsCredentialsProvider;

  /**
   * Docker credentials required for registry authentication within the workflow.
   *
   * @remarks
   * Specify one or more `DockerCredentials` instances for authenticating against Docker
   * registries (such as DockerHub, ECR, GHCR, or custom registries) used in the pipeline.
   */
  readonly dockerCredentials?: DockerCredentials[];

  /**
   * Version overrides for specific GitHub Actions used in the workflow.
   *
   * @remarks
   * Use this to specify particular versions of actions within the workflow (e.g.,
   * actions/checkout@v2). This is useful for managing dependencies and ensuring compatibility.
   */
  readonly versionOverrides?: Record<string, string>;

  /**
   * Synthesizer for the CDK application.
   *
   * @remarks
   * The synthesizer generates CloudFormation templates and other assets required
   * for deployment. This is a critical part of the CDK application lifecycle.
   */
  readonly synth: Synth;

  /**
   * Container configuration for the build environment.
   *
   * @remarks
   * Specifies settings for the container environment where build actions are executed,
   * including Docker image, registry authentication, and environment variables.
   */
  readonly buildContainer?: JobProps["container"];
}

/**
 * Constructs a GitHub Actions pipeline for deploying AWS resources.
 *
 * @remarks
 * The `GitHubActionsPipeline` provides methods to define and manage deployment stages and job waves in
 * a GitHub Actions pipeline, utilizing AWS credentials and CDK output for cloud infrastructure automation.
 */
export class GitHubActionsPipeline extends Construct {
  private readonly innerPipeline: InnerPipeline;

  /**
   * Constructs a new instance of `GitHubActionsPipeline`.
   *
   * @param scope - The parent construct scope.
   * @param id - Unique identifier for this pipeline construct.
   * @param props - Configuration properties for the pipeline.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsPipelineProps) {
    super(scope, id);
    this.innerPipeline = new InnerPipeline(this, id, props);
  }

  /**
   * Returns the name of the workflow.
   */
  public get workflowName(): string {
    return this.innerPipeline.workflowName;
  }

  /**
   * Returns the output directory path for the workflow files.
   */
  public get workflowOutdir(): string {
    return this.innerPipeline.workflowOutdir;
  }

  /**
   * Returns the filename for the workflow file.
   */
  public get workflowFilename(): string {
    return this.innerPipeline.workflowFilename;
  }

  /**
   * Adds a stage to the pipeline with GitHub-specific configuration options.
   *
   * @param stage - The CDK Stage to add to the pipeline.
   * @param options - Optional configuration for the stage.
   * @returns Deployment details for the added stage.
   */
  public addStage(stage: Stage, options: StageOptions = {}): StageDeployment {
    return this.innerPipeline.addStageWithGitHubOptions(stage, options);
  }

  /**
   * Adds a wave of jobs to the pipeline.
   *
   * @param id - Unique identifier for the wave.
   * @param options - Options for configuring the wave.
   * @returns The created GitHub wave instance.
   */
  public addWave(id: string, options: WaveOptions = {}): GitHubWave {
    return this.innerPipeline.addGitHubWave(id, options);
  }
}

/**
 * Inner class extending `PipelineBase` to manage core functionalities of the GitHub Actions pipeline.
 */
class InnerPipeline extends PipelineBase implements IWaveStageAdder {
  public readonly workflowName: string;
  public readonly workflowOutdir: string;
  public readonly workflowFilename: string;

  private readonly concurrency?: ConcurrencyOptions;
  private readonly workflowEnv?: Record<string, string>;
  private readonly jobSettings?: JobSettings;
  private readonly singlePublisherPerAssetType?: boolean;
  private readonly phases?: PipelinePhases;
  private readonly buildContainer?: ContainerOptions;
  private readonly dockerCredentials?: DockerCredentials[];
  private readonly versionOverrides?: Record<string, string>;

  private readonly awsCredentials: AwsCredentialsProvider;
  private readonly stackOptions: Record<string, StackOptions> = {};
  private readonly adapter: AwsCdkAdapter;

  /**
   * Constructs a new instance of `InnerPipeline`.
   *
   * @param scope - The parent construct.
   * @param id - Unique identifier for this inner pipeline instance.
   * @param props - Configuration properties for the pipeline.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsPipelineProps) {
    super(scope, id, { synth: props.synth });

    this.workflowName = props.workflowName ?? "Deploy";
    this.workflowOutdir = props.workflowOutdir ?? ".github/workflows";
    this.workflowFilename = props.workflowFilename ?? "deploy";
    this.workflowEnv = props.workflowEnv;
    this.concurrency = props.concurrency;

    this.jobSettings = props.jobSettings;

    this.singlePublisherPerAssetType = props.singlePublisherPerAssetType;

    this.buildContainer = props.buildContainer;

    this.phases = {
      preBuild: props.preBuild,
      postBuild: props.postBuild,
      prePublish: props.prePublish,
      postPublish: props.postPublish,
    };

    this.dockerCredentials = props.dockerCredentials;
    this.awsCredentials = props.awsCredentials;

    this.versionOverrides = props.versionOverrides;

    this.adapter = new AwsCdkAdapter(this, { outdir: this.workflowOutdir });
  }

  /**
   * Adds a stage deployment from a wave with optional configuration.
   *
   * @param stageDeployment - The stage deployment to add.
   * @param options - Configuration options for the stage.
   */
  public addStageFromWave(stageDeployment: StageDeployment, options?: StageOptions): void {
    const stacks = stageDeployment.stacks;
    this.addStackProps(stacks, "jobSettings", options?.jobSettings);
    this.addStackProps(stacks, "capabilities", options?.stackCapabilities);
  }

  /**
   * Adds a stage to the pipeline with GitHub-specific options.
   *
   * @param stage - The CDK Stage to add.
   * @param options - Configuration options for the stage.
   * @returns Deployment details for the added stage.
   */
  public addStageWithGitHubOptions(stage: Stage, options: StageOptions = {}): StageDeployment {
    const stageDeployment = this.addStage(stage, {
      pre: options.preJobs,
      post: options.postJobs,
    });

    const stacks = stageDeployment.stacks;
    this.addStackProps(stacks, "jobSettings", options?.jobSettings);
    this.addStackProps(stacks, "capabilities", options?.stackCapabilities);

    return stageDeployment;
  }

  /**
   * Adds a wave of jobs to the pipeline with GitHub-specific options.
   *
   * @param id - Unique identifier for the wave.
   * @param options - Configuration options for the wave.
   * @returns The created GitHub wave instance.
   */
  public addGitHubWave(id: string, options: WaveOptions = {}): GitHubWave {
    const wave = new GitHubWave(id, this, {
      pre: options.preJobs,
      post: options.postJobs,
    });
    this.waves.push(wave._innerWave);
    return wave;
  }

  /**
   * Builds the pipeline workflow, generating workflow files during CDK synthesis.
   *
   * @remarks
   * This method is invoked to create workflow files required by GitHub Actions, integrating CDK stack details.
   */
  protected doBuildPipeline(): void {
    const app = Stage.of(this);
    if (!app) {
      throw new Error("The GitHub Workflow must be defined within an App scope.");
    }

    const names = app.node
      .findAll()
      .filter((node) => Stack.isStack(node))
      .map((stack) => stack.stackName);

    new PipelineWorkflow(this.adapter, this.workflowFilename, {
      name: this.workflowName,
      concurrency: this.concurrency,
      commentAtTop: this.renderYamlComment(names),
      env: this.workflowEnv,
      jobSettings: this.jobSettings,
      pipeline: this,
      singlePublisherPerAssetType: this.singlePublisherPerAssetType,
      stackOptions: this.stackOptions,
      buildContainer: this.buildContainer,
      phases: this.phases,
      cdkoutDir: app.outdir,
      awsCredentials: this.awsCredentials,
      dockerCredentials: this.dockerCredentials,
      versionOverrides: this.versionOverrides,
    });
  }

  /**
   * Renders a YAML comment for the workflow file listing deployed stacks.
   *
   * @param stackNames - List of stack names to include in the comment.
   * @returns A formatted string for the YAML comment header.
   */
  protected renderYamlComment(stackNames: string[]): string {
    const header = "Generated by github-actions-cdk, DO NOT EDIT DIRECTLY!\n\n";
    const stackListHeader = "Deployed stacks from this pipeline:\n";
    const stackList = stackNames.map((stack) => `- ${stack}`).join("\n");

    return header + stackListHeader + stackList;
  }

  /**
   * Adds properties to stack options for each stack in the deployment.
   *
   * @param stacks - Array of stack deployments.
   * @param key - Property key to set in the stack options.
   * @param value - Value to assign to the specified key.
   */
  private addStackProps(stacks: StackDeployment[], key: string, value: unknown): void {
    if (value === undefined) return;

    for (const stack of stacks) {
      this.stackOptions[stack.stackArtifactId] = {
        ...this.stackOptions[stack.stackArtifactId],
        [key]: value,
      };
    }
  }
}

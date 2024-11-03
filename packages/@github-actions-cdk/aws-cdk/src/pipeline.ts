import { Stack, Stage } from "aws-cdk-lib";
import { PipelineBase, type StackDeployment, type StageDeployment } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { AwsCdkAdapter } from "./adapter";
import type { AwsCredentialsProvider } from "./aws-credentials";
import type { IJobPhase, StackOptions } from "./jobs";
import type { Synth } from "./steps";
import { GitHubWave, type IWaveStageAdder, type StageOptions, type WaveOptions } from "./wave";
import { PipelineWorkflow } from "./workflow";

/**
 * Properties for configuring the GitHub Actions pipeline.
 *
 * @remarks
 * Provides options for defining the workflow environment, AWS credentials, job phases, and version overrides,
 * along with paths and naming conventions for GitHub Actions workflows.
 */
export interface GitHubActionsPipelineProps {
  /**
   * Optional name for the GitHub Actions workflow.
   *
   * @default "Deploy"
   */
  readonly workflowName?: string;

  /**
   * Directory path for the workflow output files.
   *
   * @default ".github/workflows"
   */
  readonly workflowOutdir?: string;

  /**
   * Filename for the workflow file.
   *
   * @default "deploy"
   */
  readonly workflowFilename?: string;

  /**
   * Whether to enable a single publisher for each asset type.
   *
   * @remarks
   * When true, consolidates publishing jobs to reduce redundant asset publishing.
   *
   * @default false
   */
  readonly singlePublisherPerAssetType?: boolean;

  /**
   * Environment variables to set in the workflow.
   */
  readonly workflowEnv?: Record<string, string>;

  /**
   * Optional phase for jobs to execute before the main build steps.
   */
  readonly preBuild?: IJobPhase;

  /**
   * Optional phase for jobs to execute after the main build steps.
   */
  readonly postBuild?: IJobPhase;

  /**
   * AWS credentials provider for authenticating AWS actions.
   */
  readonly awsCredentials: AwsCredentialsProvider;

  /**
   * Version overrides for GitHub Actions used in the workflow.
   */
  readonly versionOverrides?: Record<string, string>;

  /**
   * Synthesizer for CDK applications.
   */
  readonly synth: Synth;
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

  private readonly singlePublisherPerAssetType?: boolean;
  private readonly workflowEnv?: Record<string, string>;
  private readonly preBuild?: IJobPhase;
  private readonly postBuild?: IJobPhase;
  private readonly awsCredentials: AwsCredentialsProvider;
  private readonly versionOverrides?: Record<string, string>;
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
    this.singlePublisherPerAssetType = props.singlePublisherPerAssetType;
    this.workflowEnv = props.workflowEnv;
    this.preBuild = props.preBuild;
    this.postBuild = props.postBuild;
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
    this.addStackProps(stacks, "environment", options?.gitHubEnvironment);
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
      singlePublisherPerAssetType: this.singlePublisherPerAssetType,
      commentAtTop: this.renderYamlComment(names),
      env: this.workflowEnv,
      pipeline: this,
      stackOptions: this.stackOptions,
      preBuild: this.preBuild,
      postBuild: this.postBuild,
      cdkoutDir: app.outdir,
      awsCredentials: this.awsCredentials,
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

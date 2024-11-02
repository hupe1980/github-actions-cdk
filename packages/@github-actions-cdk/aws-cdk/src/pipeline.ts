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
 */
export interface GitHubActionsPipelineProps {
  /**
   * Optional name for the GitHub Actions workflow.
   *
   * @default "Deploy"
   */
  readonly workflowName?: string;

  /**
   * Optional output directory for the workflow files.
   *
   * @default ".github/workflows"
   */
  readonly workflowOutdir?: string;

  /**
   * Optional filename for the workflow.
   *
   * @default "deploy"
   */
  readonly workflowFilename?: string;

  /**
   * Optional phase for pre-build jobs.
   */
  readonly preBuild?: IJobPhase;

  /**
   * Optional phase for post-build jobs.
   */
  readonly postBuild?: IJobPhase;

  /**
   * The AWS credentials provider for authenticating AWS actions.
   */
  readonly awsCredentials: AwsCredentialsProvider;

  /**
   * Synthesizer for CDK applications.
   */
  readonly synth: Synth;
}

/**
 * Constructs a GitHub Actions pipeline for deploying AWS resources.
 *
 * This construct provides methods to define the workflow, add stages, and manage waves of jobs.
 */
export class GitHubActionsPipeline extends Construct {
  private readonly innerPipeline: InnerPipeline;

  /**
   * Constructs a new instance of `GitHubActionsPipeline`.
   *
   * @param scope - The parent construct.
   * @param id - Unique identifier for this construct.
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
   * Returns the output directory for the workflow files.
   */
  public get workflowOutdir(): string {
    return this.innerPipeline.workflowOutdir;
  }

  /**
   * Returns the filename for the workflow.
   */
  public get workflowFilename(): string {
    return this.innerPipeline.workflowFilename;
  }

  /**
   * Adds a stage to the pipeline with GitHub-specific options.
   *
   * @param stage - The stage to add to the pipeline.
   * @param options - Optional configuration for the stage.
   * @returns The deployment information for the added stage.
   */
  public addStage(stage: Stage, options: StageOptions = {}): StageDeployment {
    return this.innerPipeline.addStageWithGitHubOptions(stage, options);
  }

  /**
   * Adds a wave of jobs to the pipeline.
   *
   * @param id - Unique identifier for the wave.
   * @param options - Configuration options for the wave.
   * @returns The created GitHub wave.
   */
  public addWave(id: string, options: WaveOptions = {}): GitHubWave {
    return this.innerPipeline.addGitHubWave(id, options);
  }
}

/**
 * Inner class that extends the PipelineBase and implements IWaveStageAdder.
 * This manages the core functionalities of the GitHub Actions pipeline.
 */
class InnerPipeline extends PipelineBase implements IWaveStageAdder {
  public readonly workflowName: string;
  public readonly workflowOutdir: string;
  public readonly workflowFilename: string;

  private readonly preBuild?: IJobPhase;
  private readonly postBuild?: IJobPhase;
  private readonly awsCredentials: AwsCredentialsProvider;

  private readonly stackOptions: Record<string, StackOptions> = {};
  private readonly adapter: AwsCdkAdapter;

  /**
   * Constructs a new instance of `InnerPipeline`.
   *
   * @param scope - The parent construct.
   * @param id - Unique identifier for this construct.
   * @param props - Configuration properties for the pipeline.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsPipelineProps) {
    super(scope, id, props);

    this.workflowName = props.workflowName ?? "Deploy";
    this.workflowOutdir = props.workflowOutdir ?? ".github/workflows";
    this.workflowFilename = props.workflowFilename ?? "deploy";

    this.preBuild = props.preBuild;
    this.postBuild = props.postBuild;
    this.awsCredentials = props.awsCredentials;

    this.adapter = new AwsCdkAdapter(this, {
      outdir: this.workflowOutdir,
    });
  }

  /**
   * Adds a stage deployment from a wave.
   *
   * @param stageDeployment - The stage deployment to add.
   * @param options - Optional configuration for the stage.
   */
  public addStageFromWave(stageDeployment: StageDeployment, options?: StageOptions): void {
    const stacks = stageDeployment.stacks;
    this.addStackProps(stacks, "capabilities", options?.stackCapabilities);
  }

  /**
   * Adds a stage with GitHub-specific options to the pipeline.
   *
   * @param stage - The stage to add.
   * @param options - Optional configuration for the stage.
   * @returns The deployment information for the added stage.
   */
  public addStageWithGitHubOptions(stage: Stage, options: StageOptions = {}): StageDeployment {
    const stageDeployment = this.addStage(stage, {
      pre: options.preJobs,
      post: options.postJobs,
    });

    const stacks = stageDeployment.stacks;
    this.addStackProps(stacks, "capabilities", options?.stackCapabilities);

    return stageDeployment;
  }

  /**
   * Adds a GitHub wave to the pipeline.
   *
   * @param id - Unique identifier for the wave.
   * @param options - Configuration options for the wave.
   * @returns The created GitHub wave.
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
   * Builds the pipeline workflow.
   *
   * This method is called during the CDK synthesis phase to generate the necessary workflow files.
   */
  protected doBuildPipeline(): void {
    const app = Stage.of(this);
    if (!app) {
      throw new Error("The GitHub Workflow must be defined in the scope of an App");
    }

    const names = app.node
      .findAll()
      .filter((node) => Stack.isStack(node))
      .map((stack) => stack.stackName);

    new PipelineWorkflow(this.adapter, this.workflowFilename, {
      name: this.workflowName,
      commentAtTop: this.renderYamlComment(names),
      pipeline: this,
      stackOptions: this.stackOptions,
      preBuild: this.preBuild,
      postBuild: this.postBuild,
      cdkoutDir: app.outdir,
      awsCredentials: this.awsCredentials,
    });
  }

  /**
   * Renders a YAML comment for the workflow file.
   *
   * @param stackNames - The names of the stacks deployed by this pipeline.
   * @returns A string containing the rendered YAML comment.
   */
  protected renderYamlComment(stackNames: string[]): string {
    const header = "Generated by github-actions-cdk, DO NOT EDIT DIRECTLY!\n\n";
    const stackListHeader = "Deployed stacks from this pipeline:\n";
    const stackList = stackNames.map((stack) => `- ${stack}`).join("\n");

    return header + stackListHeader + stackList;
  }

  /**
   * Adds properties to the stack options for each stack in the deployment.
   *
   * @param stacks - The list of stack deployments.
   * @param key - The property key to set.
   * @param value - The value to assign to the property.
   */
  private addStackProps(stacks: StackDeployment[], key: string, value: unknown) {
    if (value === undefined) {
      return;
    }
    for (const stack of stacks) {
      this.stackOptions[stack.stackArtifactId] = {
        ...this.stackOptions[stack.stackArtifactId],
        [key]: value,
      };
    }
  }
}

import type { PipelineBase, StackAsset, StackDeployment } from "aws-cdk-lib/pipelines";
import {
  type AGraphNode,
  Graph,
  PipelineGraph,
  isGraph,
} from "aws-cdk-lib/pipelines/lib/helpers-internal";
import type { Construct } from "constructs";
import { PermissionLevel, Workflow, type WorkflowProps } from "github-actions-cdk";
import type { AwsCredentialsProvider } from "./aws-credentials";
import {
  DeployPipelineJob,
  type IJobPhase,
  PublishPipelineJob,
  type StackOptions,
  StagePipelineJob,
  SynthPipelineJob,
} from "./jobs";
import { StageJob, Synth } from "./steps";

/**
 * Interface representing optional job phases for a build and publish jobs ot the pipeline.
 */
export interface PipelinePhases {
  /**
   * Optional phase for the synth job to execute before the main build steps.
   */
  readonly preBuild?: IJobPhase;

  /**
   * Optional phase for the synth job to execute after the main build steps.
   */
  readonly postBuild?: IJobPhase;

  /**
   * Optional phase for publish jobs to execute before the main publish steps.
   */
  readonly prePublish?: IJobPhase;

  /**
   * Optional phase for publish jobs to execute after the main publish steps.
   */
  readonly postPublish?: IJobPhase;
}

/**
 * Properties for defining a Pipeline Workflow.
 *
 * @remarks
 * This interface extends WorkflowProps and adds properties specific to AWS CDK Pipelines and job execution.
 */
export interface PipelineWorkflowProps extends WorkflowProps {
  /**
   * The CDK pipeline, including its stages and job configuration.
   * Defines the sequence and structure of actions for synthesizing, publishing, and deploying.
   */
  readonly pipeline: PipelineBase;

  /**
   * Whether to use a single publisher job for each type of asset.
   *
   * @remarks
   * If `true`, each asset type (e.g., file assets, Docker images) will be published by a single job in the workflow,
   * consolidating multiple asset publication steps into one job. This can reduce the total number of jobs needed,
   * making the workflow more efficient when dealing with large numbers of assets.
   *
   * Defaults to `false`, meaning each asset is published in its own job.
   */
  readonly singlePublisherPerAssetType?: boolean;

  /** Configuration options for individual stacks in the pipeline. */
  readonly stackOptions: Record<string, StackOptions>;

  /**
   * Optional phases to execute before or after main build and publish steps.
   *
   * @remarks
   * Defines custom phases (e.g., pre- and post-build/publish) that run at specific points in the pipeline workflow,
   * allowing for additional setup, cleanup, or validation steps.
   */
  readonly phases?: PipelinePhases;

  /** Provider for AWS credentials required to interact with AWS services. */
  readonly awsCredentials: AwsCredentialsProvider;

  /** Overrides for specific action versions in GitHub Actions. */
  readonly versionOverrides?: Record<string, string>;

  /** Directory where CDK generates CloudFormation templates. */
  readonly cdkoutDir: string;
}

/**
 * Represents a GitHub Actions workflow to manage CDK pipeline jobs for synthesizing, publishing, and deploying AWS resources.
 *
 * @remarks
 * Extends `Workflow` from `github-actions-cdk`, and provides structured job orchestration based on the AWS CDK pipeline graph.
 */
export class PipelineWorkflow extends Workflow {
  public readonly awsCredentials: AwsCredentialsProvider;
  public readonly versionOverrides?: Record<string, string>;
  public readonly cdkoutDir: string;
  private readonly stackOptions: Record<string, StackOptions>;
  private readonly assetHashMap: Record<string, string> = {};

  /**
   * Initializes a new `PipelineWorkflow`.
   *
   * @param scope - The scope within which this construct is created.
   * @param id - The unique identifier for this workflow.
   * @param props - Configuration properties for the pipeline workflow.
   */
  constructor(scope: Construct, id: string, props: PipelineWorkflowProps) {
    super(scope, id, props);

    this.awsCredentials = props.awsCredentials;
    this.versionOverrides = props.versionOverrides;
    this.cdkoutDir = props.cdkoutDir;
    this.stackOptions = props.stackOptions;

    const structure = new PipelineGraph(props.pipeline, {
      selfMutation: false,
      publishTemplate: true,
      prepareStep: false,
      singlePublisherPerAssetType: props.singlePublisherPerAssetType ?? false,
    });

    for (const stageNode of flatten(structure.graph.sortedChildren())) {
      if (!isGraph(stageNode)) {
        throw new Error(`Top-level children must be graphs, received: '${stageNode}'`);
      }

      const tranches = stageNode.sortedLeaves();

      for (const tranche of tranches) {
        for (const node of tranche) {
          switch (node.data?.type) {
            case "step":
              if (node.data?.isBuildStep && node.data?.step instanceof Synth) {
                this.createSynthJob(
                  node.uniqueId,
                  this.getDependencies(node),
                  node.data.step,
                  props.phases?.preBuild,
                  props.phases?.postBuild,
                );
              } else if (node.data?.step instanceof StageJob) {
                this.createStageJob(node.uniqueId, this.getDependencies(node), node.data.step);
              }
              break;
            case "publish-assets":
              this.createPublishJob(
                node.uniqueId,
                this.getDependencies(node),
                node.data.assets,
                props.phases?.prePublish,
                props.phases?.postPublish,
              );
              break;
            case "execute":
              this.createDeployJob(node.uniqueId, this.getDependencies(node), node.data.stack);
              break;
            default:
              throw new Error(`Unknown node type: ${node.data?.type}`);
          }
        }
      }
    }
  }

  /**
   * Creates a job for synthesizing the CDK application.
   *
   * @param id - Unique identifier for the synth job.
   * @param needs - List of dependencies for this job.
   * @param synth - Synth step configuration.
   * @param preBuild - Optional jobs to run before the synth job.
   * @param postBuild - Optional jobs to run after the synth job.
   */
  protected createSynthJob(
    id: string,
    needs: string[],
    synth: Synth,
    preBuild?: IJobPhase,
    postBuild?: IJobPhase,
  ): void {
    new SynthPipelineJob(this, id, {
      name: "Synthesize",
      needs,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.awsCredentials.permissionLevel(),
      },
      installCommands: synth.installCommands,
      commands: synth.commands,
      env: synth.env,
      preBuild,
      postBuild,
      awsCredentials: this.awsCredentials,
      versionOverrides: this.versionOverrides,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for publishing stack assets.
   *
   * @param id - Unique identifier for the publish job.
   * @param needs - List of dependencies for this job.
   * @param assets - List of assets to publish.
   */
  protected createPublishJob(
    id: string,
    needs: string[],
    assets: StackAsset[],
    prePublish?: IJobPhase,
    postPublish?: IJobPhase,
  ): void {
    new PublishPipelineJob(this, id, {
      name: `Publish Assets ${id}`,
      needs,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.awsCredentials.permissionLevel(),
      },
      assets,
      prePublish,
      postPublish,
      assetHashMap: this.assetHashMap,
      awsCredentials: this.awsCredentials,
      versionOverrides: this.versionOverrides,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for deploying a stack to AWS.
   *
   * @param id - Unique identifier for the deploy job.
   * @param needs - List of dependencies for this job.
   * @param stack - Stack deployment information.
   */
  protected createDeployJob(id: string, needs: string[], stack: StackDeployment): void {
    const options = this.stackOptions[stack.stackArtifactId];

    new DeployPipelineJob(this, id, {
      name: `Deploy ${stack.stackArtifactId}`,
      needs,
      environment: options?.environment,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.awsCredentials.permissionLevel(),
      },
      stack,
      assetHashMap: this.assetHashMap,
      stackOptions: options,
      awsCredentials: this.awsCredentials,
      versionOverrides: this.versionOverrides,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for running a stage job in the pipeline.
   *
   * @param id - Unique identifier for the stage job.
   * @param needs - List of dependencies for this job.
   * @param job - Configuration of the stage job.
   */
  protected createStageJob(id: string, needs: string[], job: StageJob): void {
    new StagePipelineJob(this, id, {
      name: job.id,
      needs,
      phase: job.props,
      awsCredentials: this.awsCredentials,
      versionOverrides: this.versionOverrides,
      cdkoutDir: this.cdkoutDir,
      ...job.props,
    });
  }

  /**
   * Retrieves a list of dependencies for a given graph node.
   *
   * @param node - The graph node to analyze for dependencies.
   * @returns An array of unique IDs representing dependencies of the node.
   */
  private getDependencies(node: AGraphNode): string[] {
    const deps = [];

    for (const dep of node.allDeps) {
      if (dep instanceof Graph) {
        deps.push(...dep.allLeaves().nodes);
      } else {
        deps.push(dep);
      }
    }

    return deps.map((dependency) => dependency.uniqueId);
  }
}

/**
 * Utility function to flatten an iterable of arrays into a single iterable.
 *
 * @param xs - The input iterable containing arrays.
 * @returns A flattened iterable.
 */
function* flatten<A>(xs: Iterable<A[]>): IterableIterator<A> {
  for (const x of xs) {
    yield* x;
  }
}

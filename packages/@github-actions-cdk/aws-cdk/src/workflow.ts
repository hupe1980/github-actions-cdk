import type { PipelineBase, StackAsset, StackDeployment } from "aws-cdk-lib/pipelines";
import {
  type AGraphNode,
  Graph,
  PipelineGraph,
  isGraph,
} from "aws-cdk-lib/pipelines/lib/helpers-internal";
import type { Construct } from "constructs";
import {
  type ContainerOptions,
  type JobProps,
  PermissionLevel,
  Runner,
  Workflow,
  type WorkflowProps,
} from "github-actions-cdk";
import {
  DeployPipelineJob,
  type IJobPhase,
  type PipelineJobProps,
  PublishPipelineJob,
  type StackOptions,
  StagePipelineJob,
  SynthPipelineJob,
} from "./jobs";
import { StageJob, Synth } from "./steps";

/**
 * Settings to configure specific job options in the pipeline workflow.
 */
export interface JobSettings {
  /**
   * Specifies the environment configuration for the job.
   *
   * @remarks
   * Defines the environment variables, secrets, and other environment-specific
   * settings for the job execution in the GitHub Actions workflow.
   */
  readonly environment?: JobProps["environment"];

  /**
   * Optional condition that determines if the job should run.
   *
   * @remarks
   * An expression or string that evaluates to a boolean. If provided, this condition
   * must be met for the job to execute.
   */
  readonly condition?: JobProps["condition"];
}

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
export interface PipelineWorkflowProps extends WorkflowProps, PipelineJobProps {
  /**
   * The CDK pipeline, including its stages and job configuration.
   * Defines the sequence and structure of actions for synthesizing, publishing, and deploying.
   */
  readonly pipeline: PipelineBase;

  /**
   * Optional configuration settings for individual jobs within the pipeline.
   *
   * @remarks
   * `JobSettings` allow fine-tuning of job-specific behavior, including conditions and
   * environment configurations that are applied to individual jobs in the pipeline.
   */
  readonly jobSettings?: JobSettings;

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

  /**
   * Container configuration for the build environment.
   *
   * @remarks
   * Specifies settings for the container environment where build actions are executed,
   * including Docker image, registry authentication, and environment variables.
   */
  readonly buildContainer?: ContainerOptions;
}

/**
 * Represents a GitHub Actions workflow to manage CDK pipeline jobs for synthesizing, publishing, and deploying AWS resources.
 *
 * @remarks
 * Extends `Workflow` from `github-actions-cdk`, and provides structured job orchestration based on the AWS CDK pipeline graph.
 */
export class PipelineWorkflow extends Workflow {
  protected readonly jobSettings?: JobSettings;
  protected readonly runner?: Runner;
  protected readonly buildContainer?: ContainerOptions;
  protected readonly phases?: PipelinePhases;
  protected readonly pipelineJobProps: PipelineJobProps;
  protected readonly stackOptions: Record<string, StackOptions>;
  protected readonly assetHashMap: Record<string, string> = {};

  /**
   * Initializes a new `PipelineWorkflow`.
   *
   * @param scope - The scope within which this construct is created.
   * @param id - The unique identifier for this workflow.
   * @param props - Configuration properties for the pipeline workflow.
   */
  constructor(scope: Construct, id: string, props: PipelineWorkflowProps) {
    super(scope, id, props);

    this.jobSettings = props.jobSettings;

    this.runner = props.runner ?? Runner.UBUNTU_LATEST;

    this.buildContainer = props.buildContainer;

    this.phases = props.phases;

    this.pipelineJobProps = {
      awsCredentials: props.awsCredentials,
      dockerCredentials: props.dockerCredentials,
      versionOverrides: props.versionOverrides,
      cdkoutDir: props.cdkoutDir,
    };

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
                this.createSynthJob(node.uniqueId, this.getDependencies(node), node.data.step);
              } else if (node.data?.step instanceof StageJob) {
                this.createStageJob(node.uniqueId, this.getDependencies(node), node.data.step);
              }
              break;
            case "publish-assets":
              this.createPublishJob(node.uniqueId, this.getDependencies(node), node.data.assets);
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
   */
  protected createSynthJob(id: string, needs: string[], synth: Synth): void {
    new SynthPipelineJob(this, id, {
      name: "Synthesize",
      needs,
      runner: this.runner,
      ...this.jobSettings,
      permissions: {
        contents: PermissionLevel.READ,
      },
      installCommands: synth.installCommands,
      commands: synth.commands,
      env: synth.env,
      container: this.buildContainer,
      preBuild: this.phases?.preBuild,
      postBuild: this.phases?.postBuild,
      ...this.pipelineJobProps,
    });
  }

  /**
   * Creates a job for publishing stack assets.
   *
   * @param id - Unique identifier for the publish job.
   * @param needs - List of dependencies for this job.
   * @param assets - List of assets to publish.
   */
  protected createPublishJob(id: string, needs: string[], assets: StackAsset[]): void {
    new PublishPipelineJob(this, id, {
      name: `Publish Assets ${id}`,
      needs,
      runner: this.runner,
      ...this.jobSettings,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.pipelineJobProps.awsCredentials.permissionLevel(),
      },
      assets,
      prePublish: this.phases?.prePublish,
      postPublish: this.phases?.postPublish,
      assetHashMap: this.assetHashMap,
      ...this.pipelineJobProps,
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
      runner: this.runner,
      ...this.jobSettings,
      ...options?.jobSettings,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.pipelineJobProps.awsCredentials.permissionLevel(),
      },
      stack,
      assetHashMap: this.assetHashMap,
      stackOptions: options,
      ...this.pipelineJobProps,
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
      runner: this.runner,
      phase: job.props,
      ...job.props,
      ...this.pipelineJobProps,
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

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

export interface PipelineWorkflowProps extends WorkflowProps {
  /** The pipeline being defined, including stages and jobs. */
  readonly pipeline: PipelineBase;

  /** Options for configuring individual stacks in the pipeline. */
  readonly stackOptions: Record<string, StackOptions>;

  /** Optional phase to execute before build jobs. */
  readonly preBuild?: IJobPhase;

  /** Optional phase to execute after build jobs. */
  readonly postBuild?: IJobPhase;

  /** AWS credentials provider for authenticating with AWS services. */
  readonly awsCredentials: AwsCredentialsProvider;

  /** Output directory for CloudFormation templates. */
  readonly cdkoutDir: string;
}

/**
 * Represents a workflow that manages the pipeline jobs for synthesizing, publishing, and deploying resources.
 *
 * This class extends the Workflow class from the GitHub Actions CDK to provide
 * a structured way of orchestrating pipeline jobs based on the AWS CDK pipeline graph.
 */
export class PipelineWorkflow extends Workflow {
  public readonly awsCredentials: AwsCredentialsProvider;
  public readonly cdkoutDir: string;

  private readonly stackOptions: Record<string, StackOptions>;

  /**
   * Constructs a new instance of PipelineWorkflow.
   *
   * @param scope - The scope in which this construct is defined.
   * @param id - Unique identifier for this workflow.
   * @param props - Properties for configuring the pipeline workflow.
   */
  constructor(scope: Construct, id: string, props: PipelineWorkflowProps) {
    super(scope, id, props);

    this.awsCredentials = props.awsCredentials;
    this.cdkoutDir = props.cdkoutDir;
    this.stackOptions = props.stackOptions;

    const structure = new PipelineGraph(props.pipeline, {
      selfMutation: false,
      publishTemplate: true,
      prepareStep: false, // The changeset is created and executed in a single job.
    });

    for (const stageNode of flatten(structure.graph.sortedChildren())) {
      if (!isGraph(stageNode)) {
        throw new Error(`Top-level children must be graphs, got '${stageNode}'`);
      }

      const tranches = stageNode.sortedLeaves();

      for (const tranche of tranches) {
        for (const node of tranche) {
          switch (node.data?.type) {
            case "step":
              if (node.data?.isBuildStep) {
                if (node.data?.step instanceof Synth) {
                  this.jobForSynth(
                    node.uniqueId,
                    this.renderDependencies(node),
                    node.data.step,
                    props.preBuild,
                    props.postBuild,
                  );
                } else {
                  throw new Error("Only SynthStep is supported as a build step");
                }
              } else if (node.data?.step instanceof StageJob) {
                this.jobForStage(node.uniqueId, this.renderDependencies(node), node.data.step);
              }
              break;
            case "publish-assets":
              this.jobForPublish(node.uniqueId, this.renderDependencies(node), node.data.assets);
              break;
            case "execute":
              this.jobForDeploy(node.uniqueId, this.renderDependencies(node), node.data.stack);
              break;
            default:
              throw new Error(`Unknown node type: ${node.data?.type}`);
          }
        }
      }
    }
  }

  /**
   * Creates a job for synthesizing the application.
   *
   * @param id - Unique identifier for the synth job.
   * @param needs - List of job IDs that this job depends on.
   * @param synth - The Synth step configuration.
   * @param preBuild - Optional jobs to run before the synth job.
   * @param postBuild - Optional jobs to run after the synth job.
   */
  protected jobForSynth(
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
      env: synth.env,
      preBuild,
      postBuild,
      installCommands: synth.installCommands,
      commands: synth.commands,
      awsCredentials: this.awsCredentials,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for publishing stack assets.
   *
   * @param id - Unique identifier for the publish job.
   * @param needs - List of job IDs that this job depends on.
   * @param assets - The stack assets to publish.
   */
  protected jobForPublish(id: string, needs: string[], assets: StackAsset[]): void {
    new PublishPipelineJob(this, id, {
      name: `Publish Assets ${id}`,
      needs,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.awsCredentials.permissionLevel(),
      },
      assets,
      awsCredentials: this.awsCredentials,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for deploying a stack.
   *
   * @param id - Unique identifier for the deploy job.
   * @param needs - List of job IDs that this job depends on.
   * @param stack - The stack deployment information.
   */
  protected jobForDeploy(id: string, needs: string[], stack: StackDeployment): void {
    const stackOptions = this.stackOptions[stack.stackArtifactId];

    new DeployPipelineJob(this, id, {
      name: `Deploy ${stack.stackArtifactId}`,
      needs,
      environment: stackOptions?.environment,
      permissions: {
        contents: PermissionLevel.READ,
        idToken: this.awsCredentials.permissionLevel(),
      },
      stack,
      stackOptions,
      awsCredentials: this.awsCredentials,
      cdkoutDir: this.cdkoutDir,
    });
  }

  /**
   * Creates a job for running a stage job.
   *
   * @param id - Unique identifier for the stage job.
   * @param needs - List of job IDs that this job depends on.
   * @param job - The stage job configuration.
   */
  protected jobForStage(id: string, needs: string[], job: StageJob): void {
    new StagePipelineJob(this, id, {
      name: job.id,
      needs,
      phase: job.props,
      awsCredentials: this.awsCredentials,
      cdkoutDir: this.cdkoutDir,
      ...job.props,
    });
  }

  /**
   * Renders the dependencies for a given node in the graph.
   *
   * @param node - The graph node whose dependencies need to be rendered.
   * @returns An array of unique IDs representing the node's dependencies.
   */
  private renderDependencies(node: AGraphNode): string[] {
    const deps = new Array<AGraphNode>();

    for (const d of node.allDeps) {
      if (d instanceof Graph) {
        deps.push(...d.allLeaves().nodes);
      } else {
        deps.push(d);
      }
    }

    return deps.map((x) => x.uniqueId);
  }
}

/**
 * Flattens an iterable of arrays into a single iterable.
 *
 * @param xs - The input iterable containing arrays to flatten.
 * @returns An iterable of the flattened elements.
 */
function* flatten<A>(xs: Iterable<A[]>): IterableIterator<A> {
  for (const x of xs) {
    for (const y of x) {
      yield y;
    }
  }
}

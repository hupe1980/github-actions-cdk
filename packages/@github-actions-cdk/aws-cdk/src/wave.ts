import type { Stage } from "aws-cdk-lib";
import { type StageDeployment, Wave, type WaveProps } from "aws-cdk-lib/pipelines";
import type { StageJob } from "./steps";
import type { JobSettings } from "./workflow";

/**
 * Interface for adding stages to a wave in the GitHub Actions pipeline.
 *
 * This interface provides a method to incorporate stages from a stage deployment
 * into a wave, allowing for organized grouping of related stages.
 */
export interface IWaveStageAdder {
  /**
   * Adds a stage from a given stage deployment into the wave.
   *
   * @param stageDeployment - The deployment information for the stage to be added.
   * @param options - Optional configuration for the stage, including pre- and post-jobs.
   */
  addStageFromWave(stageDeployment: StageDeployment, options?: StageOptions): void;
}

/**
 * Enumeration for IAM capabilities that must be acknowledged in AWS CloudFormation templates.
 *
 * These capabilities are required for stacks that include IAM resources or specific features.
 *
 * @see [AWS CloudFormation IAM Capabilities Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-template.html#capabilities)
 */
export enum StackCapabilities {
  /** Acknowledge that the stack includes IAM resources. */
  IAM = "CAPABILITY_IAM",

  /** Acknowledge that the stack includes custom names for IAM resources. */
  NAMED_IAM = "CAPABILITY_NAMED_IAM",

  /** Acknowledge that the stack contains one or more macros. */
  AUTO_EXPAND = "CAPABILITY_AUTO_EXPAND",
}

/**
 * Options for configuring a stage in the GitHub Actions pipeline.
 */
export interface StageOptions {
  /**
   * Optional list of jobs to run before the main stage execution.
   *
   * These jobs can prepare the environment or handle setup tasks.
   */
  readonly preJobs?: StageJob[];

  /**
   * Optional list of jobs to run after the main stage execution.
   *
   * These jobs can perform cleanup or other necessary tasks.
   */
  readonly postJobs?: StageJob[];

  /**
   * Optional settings to configure the jobs within the stage.
   */
  readonly jobSettings?: JobSettings;

  /**
   * Optional capabilities that the stack should acknowledge during deployment.
   *
   * These capabilities are particularly relevant for stacks with IAM resources or macros.
   */
  readonly stackCapabilities?: StackCapabilities[];
}

/**
 * Options for configuring a wave in the GitHub Actions pipeline.
 */
export interface WaveOptions {
  /**
   * Optional list of jobs to run before any stages in the wave.
   *
   * This allows for preparatory tasks or environment setup for the entire wave.
   */
  readonly preJobs?: StageJob[];

  /**
   * Optional list of jobs to run after all stages in the wave.
   *
   * This can be useful for cleanup or finalization tasks that should occur
   * after all stages have completed.
   */
  readonly postJobs?: StageJob[];
}

/**
 * Represents a wave in the GitHub Actions pipeline.
 *
 * This class provides a wrapper around the Wave class from the AWS CDK pipelines module,
 * enabling additional functionality for managing stages with specific options and configurations.
 */
export class GitHubWave {
  private readonly innerWave: Wave;

  /**
   * Constructs a new instance of GitHubWave.
   *
   * @param id - Unique identifier for the wave.
   * @param waveStageAdder - An instance of IWaveStageAdder to manage the addition of stages.
   * @param props - Optional properties to configure the wave.
   */
  constructor(
    public readonly id: string,
    private waveStageAdder: IWaveStageAdder,
    props: WaveProps = {},
  ) {
    this.innerWave = new Wave(id, props);
  }

  /**
   * Adds a stage to the wave with specified options.
   *
   * This method creates a deployment for the provided stage and integrates it
   * into the wave, managing pre- and post-jobs as configured.
   *
   * @param stage - The stage to be added to the wave.
   * @param options - Optional configuration for the stage.
   * @returns The deployment information for the added stage.
   */
  public addStage(stage: Stage, options: StageOptions = {}): StageDeployment {
    const stageDeployment = this.innerWave.addStage(stage, {
      pre: options.preJobs,
      post: options.postJobs,
    });
    this.waveStageAdder.addStageFromWave(stageDeployment, options);
    return stageDeployment;
  }

  /**
   * Internal method to access the wrapped Wave instance.
   *
   * This is intended for use within the implementation and should not be called
   * from outside the class.
   *
   * @internal
   */
  public get _innerWave() {
    return this.innerWave;
  }
}

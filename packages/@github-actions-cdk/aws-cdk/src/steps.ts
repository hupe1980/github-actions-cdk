import { ShellStep, Step } from "aws-cdk-lib/pipelines";
import type { JobProps } from "github-actions-cdk";
import type { IJobPhase } from "./jobs";

/**
 * Properties for configuring a Synth step in the GitHub Actions pipeline.
 */
export interface SynthProps {
  /**
   * Optional environment variables to set during the step execution.
   *
   * These variables can be used to configure the behavior of the commands run in the synth step.
   */
  readonly env?: Record<string, string>;

  /**
   * Optional list of commands to run for installing dependencies before executing the main commands.
   *
   * @default - No install commands will be executed.
   */
  readonly installCommands?: string[];

  /**
   * The main commands to execute for the synth step.
   *
   * These commands typically include build or synthesis commands for the CDK application.
   */
  readonly commands: string[];
}

/**
 * Represents a Synth step in a GitHub Actions pipeline.
 *
 * This step is responsible for synthesizing the AWS CloudFormation templates
 * from the CDK application. It extends the ShellStep to execute shell commands
 * defined in the properties.
 */
export class Synth extends ShellStep {
  /**
   * Constructs a new instance of the Synth step.
   *
   * @param props - Configuration properties for the synth step.
   */
  constructor(props: SynthProps) {
    super("synth", {
      env: props.env,
      installCommands: props.installCommands,
      commands: props.commands,
    });
  }
}

/**
 * Options for configuring a job in a stage of the GitHub Actions pipeline.
 */
export interface IStageJobOptions extends IJobPhase {
  /**
   * Optional name for the job.
   *
   * If not specified, a default name will be generated.
   */
  readonly name?: JobProps["name"];

  /**
   * Optional environment variables for the job.
   *
   * These variables will be set in the job's execution environment.
   */
  readonly env?: JobProps["env"];

  /**
   * Optional permissions for the job.
   *
   * These permissions control the actions that the job can perform in the GitHub Actions environment.
   */
  readonly permissions?: JobProps["permissions"];

  /**
   * Optional configuration for the job's environment.
   *
   * This allows for additional customization of the job's execution context.
   */
  readonly environment?: JobProps["environment"];
}

/**
 * Represents a job in a stage of the GitHub Actions pipeline.
 *
 * This class extends the Step class, providing functionality for executing a job
 * with specified options and configurations.
 */
export class StageJob extends Step {
  /**
   * Constructs a new instance of StageJob.
   *
   * @param id - Unique identifier for the job step.
   * @param props - Configuration options for the job.
   */
  constructor(
    public readonly id: string,
    public props: IStageJobOptions,
  ) {
    super(id);
  }
}

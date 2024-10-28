import type { Job } from "./job";
import type { RegularStep } from "./step";

/**
 * Configuration properties for a GitHub Action.
 *
 * @remarks
 * These properties specify the essential configuration details for a GitHub Action.
 * The `name` is optional and serves as a display name in workflow logs, while the
 * `version` is required to define the specific action version to be used.
 */
export interface ActionProps {
  /**
   * Optional display name for the action, used in workflow logs.
   *
   * @example "Checkout Repository"
   */
  readonly name?: string;

  /**
   * Specifies the version of the action. This can be a release tag (e.g., "v2"),
   * a branch name, or a commit SHA, allowing for precise version control.
   *
   * @example "v2" // Uses version 2 of the action
   */
  readonly version: string;
}

/**
 * Abstract representation of a GitHub Action associated with a Job.
 *
 * @remarks
 * The `Action` class serves as a foundational building block for defining actions in
 * GitHub Actions workflows. Each action has a unique `id`, an optional `name` for
 * display purposes, and a mandatory `version` to specify the action version.
 * Subclasses of `Action` are expected to implement the `bind` method to define how
 * the action integrates with a specific job configuration.
 */
export abstract class Action {
  /** Unique identifier for the action, required to be unique within a job's context. */
  public readonly id: string;

  /** Optional display name used in workflow logs for readability. */
  public readonly name?: string;

  /** Version of the action, defining the specific variant to execute in the workflow. */
  public readonly version: string;

  /**
   * Initializes a new `Action` instance with an identifier and configuration properties.
   *
   * @param id - A unique identifier for the action instance, which must be unique within a job.
   * @param props - The configuration properties for the action, including `name` and `version`.
   */
  constructor(id: string, props: ActionProps) {
    this.id = id;
    this.name = props.name;
    this.version = props.version;
  }

  /**
   * Associates the action with a specified Job within the workflow.
   *
   * @remarks
   * This method is abstract and must be implemented by subclasses. The purpose of the
   * `bind` method is to integrate the action with a `Job` and return a `RegularStep`
   * representing the action’s operation within the job.
   *
   * @param job - The `Job` to which this action is bound, enabling its execution within that job.
   * @returns A `RegularStep` instance representing the action as a step within the job.
   */
  public abstract bind(job: Job): RegularStep;
}

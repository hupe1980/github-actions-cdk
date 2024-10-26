import type { Job } from "./job";
import type { Step } from "./step";

/**
 * Properties required to configure an Action.
 */
export interface ActionProps {
  /**
   * Optional name for the action, displayed in logs.
   * @example "Checkout Repository"
   */
  readonly name?: string;

  /**
   * The version of the action, can be a specific version, tag, or commit SHA.
   * @example version: "v2"
   */
  readonly version: string;
}

/**
 * Abstract representation of a GitHub Action bound to a Job.
 *
 * Actions are reusable units in GitHub Actions workflows for performing tasks.
 * Subclasses should implement the `bind` method for specific job interactions.
 */
export abstract class Action {
  /** Unique identifier for the action, must be unique within a job. */
  public readonly id: string;

  /** Optional name for display in workflow logs. */
  public readonly name?: string;

  /** Version of the action to use in the workflow. */
  public readonly version: string;

  /**
   * Initializes an Action instance.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for the action.
   */
  constructor(id: string, props: ActionProps) {
    this.id = id;
    this.name = props.name;
    this.version = props.version;
  }

  /**
   * Binds the action to a specified Job within the workflow.
   * @param job - The Job to bind the Action to.
   * @returns A Step that integrates the action into the job.
   */
  public abstract bind(job: Job): Step;
}

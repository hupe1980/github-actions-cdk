import type { Job } from "./job";
import type { RegularStep } from "./step";

/**
 * Configuration properties for a GitHub Action.
 *
 * @remarks
 * The `ActionProps` interface defines essential properties for configuring a GitHub Action.
 * The `name` property is optional and is useful for providing a display name within workflow logs.
 * The `version` property is optional but recommended, allowing precise control over the action version.
 */
export interface ActionProps {
  /**
   * Optional display name for the action, used in workflow logs for readability.
   *
   * @example "Checkout Repository"
   */
  readonly name?: string;

  /**
   * Specifies the version of the action to use. This can be a release tag (e.g., "v2"),
   * a branch name, or a commit SHA, allowing for precise version control.
   * When omitted, the latest version may be used, depending on the action's setup.
   *
   * @example "v2" // Uses version 2 of the action
   */
  readonly version?: string;
}

/**
 * Abstract base class representing a GitHub Action associated with a job in a workflow.
 *
 * @remarks
 * The `Action` class provides a foundational structure for defining GitHub Actions in workflows.
 * Each action includes a unique `id`, an optional `name` for display purposes, and an optional `version`.
 * The `bind` method must be implemented by subclasses to specify how the action integrates with a `Job`.
 */
export abstract class Action {
  /** Unique identifier for the action, required to ensure distinctness within a job context. */
  public readonly id: string;

  /** Optional display name for the action, used in workflow logs for clarity. */
  public readonly name?: string;

  /** Version of the action, specifying the particular variant to execute in the workflow. */
  public readonly version?: string;

  /**
   * Constructs a new `Action` instance with the given identifier and properties.
   *
   * @param id - A unique identifier for the action within a job's context.
   * @param props - Configuration properties for the action, including optional `name` and `version`.
   */
  constructor(id: string, props: ActionProps) {
    this.id = id;
    this.name = props.name;
    this.version = props.version;
  }

  /**
   * Integrates the action with a specified job within the workflow.
   *
   * @remarks
   * This abstract method must be implemented by subclasses to define how the action
   * is configured within a `Job`. It should return a `RegularStep` representing the
   * action’s execution as a step within the job.
   *
   * @param job - The `Job` object to which this action is bound, allowing it to run within that job.
   * @returns A `RegularStep` instance, representing the action as a configured step within the job.
   */
  public abstract bind(job: Job): RegularStep;

  /**
   * Constructs the formatted `uses` string required by GitHub Actions, incorporating the action identifier
   * and optional version.
   *
   * @remarks
   * This method handles conditional inclusion of the `version` field in the `uses` string.
   *
   * @param actionIdentifier - The identifier of the GitHub Action to use, e.g., "actions/checkout".
   * @returns The formatted `uses` string, including the action identifier and version if specified.
   */
  protected renderUses(actionIdentifier: string): string {
    return `${actionIdentifier}${this.version ? `@${this.version}` : ""}`;
  }

  /**
   * Retrieves the display name of the action, if specified.
   *
   * @remarks
   * This method is useful for accessing the `name` property in a standardized manner, which can
   * enhance workflow readability. If `name` is not defined, it returns `undefined`.
   *
   * @returns The display name of the action, or `undefined` if no name is set.
   */
  protected renderName(): string | undefined {
    return this.name;
  }
}

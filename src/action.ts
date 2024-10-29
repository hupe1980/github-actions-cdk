import { Construct, type IConstruct } from "constructs";
import type { RegularStep } from "./step";

/**
 * Base configuration properties shared by GitHub Actions.
 *
 * @remarks
 * The `CommonActionProps` interface provides basic properties for configuring a GitHub Action.
 * It includes an optional `name` property, useful for providing a display name in workflow logs.
 */
export interface CommonActionProps {
  /**
   * Optional display name for the action, displayed in workflow logs for readability.
   *
   * @example "Checkout Repository"
   */
  readonly name?: string;
}

/**
 * Comprehensive configuration for defining a GitHub Action.
 *
 * @remarks
 * The `ActionProps` interface extends `CommonActionProps` with properties essential
 * for identifying and versioning a GitHub Action. This includes an `actionIdentifier`
 * to specify the action's reference in workflows and a `version` to control the action version.
 */
export interface ActionProps extends CommonActionProps {
  /**
   * Identifier of the action, typically in the format of `owner/repo` (e.g., `"actions/checkout"`).
   *
   * @remarks
   * This uniquely identifies the action in GitHub's action marketplace or within repositories.
   * It is required to resolve the action's source for execution.
   *
   * @example "actions/checkout"
   */
  readonly actionIdentifier: string;

  /**
   * Specifies the version of the action, allowing control over the specific release, branch, or commit SHA.
   * If omitted, the action may use its latest default version.
   *
   * @example "v2" // Uses version 2 of the action
   */
  readonly version: string;
}

/**
 * Abstract base class representing a GitHub Action in a workflow.
 *
 * @remarks
 * The `Action` class provides a framework for defining GitHub Actions in workflows.
 * Subclasses must implement `createRegularStep` to define steps for this action.
 * It also offers computed properties `id` and `uses` to access the action’s identifier and version.
 */
export abstract class Action extends Construct {
  /** Optional display name for the action, displayed in workflow logs for clarity. */
  public readonly name?: string;

  /** Unique identifier for the action, specifying its source in GitHub workflows. */
  public readonly actionIdentifier: string;

  /** Version of the action, specifying the variant to execute in the workflow. */
  public readonly version: string;

  /** The regular step associated with this action, representing its execution in a workflow. */
  public readonly regularStep: RegularStep;

  /**
   * Constructs a new instance of the `Action` class.
   *
   * @param scope - The scope in which this action is defined.
   * @param id - A unique identifier for this action within the construct tree.
   * @param props - Configuration properties for the action, including its identifier and version.
   */
  constructor(scope: IConstruct, id: string, props: ActionProps) {
    super(scope, id);

    this.name = props.name;
    this.actionIdentifier = props.actionIdentifier;
    this.version = props.version;

    // Initialize the action by creating the associated RegularStep
    this.regularStep = this.createRegularStep();
  }

  /**
   * Creates a `RegularStep` associated with this action.
   *
   * @remarks
   * This method must be implemented by subclasses to specify the details of the workflow step(s)
   * executed by this action. The resulting `RegularStep` integrates the action's behavior in the workflow.
   */
  protected abstract createRegularStep(): RegularStep;

  /**
   * Retrieves the unique identifier of this action within the construct tree.
   *
   * @returns A string representing the action's unique ID.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Generates the `uses` string in GitHub Actions syntax, combining the action identifier and version.
   *
   * @returns A string in the format `identifier@version`, used to specify the action in workflows.
   * @example "actions/checkout@v2"
   */
  get uses(): string {
    return `${this.actionIdentifier}${this.version ? `@${this.version}` : ""}`;
  }
}

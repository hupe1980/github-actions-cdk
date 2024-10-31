import type { IConstruct } from "constructs";
import { RegularStep } from "./step";

/**
 * Base configuration properties shared across GitHub Actions.
 *
 * @remarks
 * The `CommonActionProps` interface defines the basic, reusable properties that can be used across various
 * GitHub Actions, including a customizable `name` for the action.
 */
export interface CommonActionProps {
  /**
   * Display name for the action, shown in GitHub workflow logs for better readability.
   *
   * @example "Checkout Repository"
   */
  readonly name?: string;
}

/**
 * Configuration properties specific to defining a GitHub Action instance in a workflow.
 *
 * @remarks
 * `ActionProps` extends `CommonActionProps` by adding essential properties to identify a GitHub Action,
 * such as `actionIdentifier` for the action's source and `version` for the specific release or branch.
 */
export interface ActionProps extends CommonActionProps {
  /**
   * Unique identifier for the action, typically formatted as `owner/repo`.
   *
   * @remarks
   * This identifier specifies the source of the action, either from GitHub Marketplace or within a repository.
   *
   * @example "actions/checkout" // Refers to the GitHub Actions `checkout` action
   */
  readonly actionIdentifier: string;

  /**
   * Version of the action, which can be a specific release, branch, or commit SHA.
   *
   * @remarks
   * When defined, this version ensures that the action uses a specific release. Leaving it undefined will
   * generally result in the action using its latest version.
   *
   * @example "v2" // Uses version 2 of the action
   */
  readonly version: string;

  /**
   * Parameters specific to this action, typically a set of key-value pairs.
   *
   * @remarks
   * These parameters are passed directly to the action, enabling customization based on the action's expected
   * inputs (e.g., repository, path, or token).
   *
   * @example `{ repository: "my-org/my-repo", token: "ghp_xxx..." }`
   */
  readonly parameters: Record<string, unknown>;
}

/**
 * Abstract base class to represent a GitHub Action in a workflow.
 *
 * @remarks
 * The `Action` class is a representation of a GitHub Action in a workflow.
 */
export class Action extends RegularStep {
  /**
   * Constructs a new instance of the `Action` class.
   *
   * @param scope - The construct scope within which this action is defined.
   * @param id - A unique identifier for the action within the construct tree.
   * @param props - Configuration properties for this action, including `actionIdentifier`, `version`, and any parameters.
   */
  constructor(scope: IConstruct, id: string, props: ActionProps) {
    super(scope, id, {
      name: props.name,
      uses: `${props.actionIdentifier}@${props.version}`,
      parameters: props.parameters,
    });
  }
}

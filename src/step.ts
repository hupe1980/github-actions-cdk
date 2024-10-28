import type { IConstruct } from "constructs";
import { type ShellType, validShells } from "./common";
import { Component } from "./component";
import { cleanObject } from "./private/utils";

// Unique symbols to mark instances of StepBase, RunStep, and RegularStep
const STEP_BASE_SYMBOL = Symbol.for("github-actions-cdk.StepBase");
const RUN_STEP_SYMBOL = Symbol.for("github-actions-cdk.RunStep");
const REGULAR_STEP_SYMBOL = Symbol.for("github-actions-cdk.RegularStep");

/**
 * Common properties for all step types in a GitHub Actions workflow job.
 */
export interface CommonStepProps {
  /**
   * A descriptive name for the step, displayed in the GitHub Actions UI.
   * @example "Install dependencies"
   */
  readonly name?: string;

  /**
   * Conditional expression to determine if the step should run (equivalent to `if` in GitHub Actions).
   * Supports GitHub Actions expressions, e.g., `${{ success() }}`.
   * @example "${{ github.event_name == 'push' }}"
   */
  readonly condition?: string;

  /**
   * Maximum execution time for the step, in minutes.
   * @example 10
   */
  readonly timeoutMinutes?: number;

  /**
   * Whether the job should continue if this step fails.
   * @default false
   */
  readonly continueOnError?: boolean;

  /**
   * Environment variables specific to this step, overriding job-level or workflow-level variables.
   * @example { "NODE_ENV": "production" }
   */
  readonly env?: Record<string, string>;
}

/**
 * Configuration for a step that runs a shell command.
 */
export interface RunStepProps extends CommonStepProps {
  /**
   * Commands or scripts to execute in this step.
   * @example ["npm", "install"]
   */
  readonly run: string | string[];

  /**
   * Directory in which the step's command or action executes.
   * Defaults to the job's working directory if not specified.
   * @example "src/"
   */
  readonly workingDirectory?: string;

  /**
   * Shell environment for this step, allowing custom shells like `bash`, `pwsh`, etc.
   * @default "bash"
   * @example "pwsh"
   */
  readonly shell?: ShellType;
}

/**
 * Configuration for a step that uses a predefined GitHub Action.
 */
export interface RegularStepProps extends CommonStepProps {
  /**
   * GitHub Action to run, identified by repository or Docker image reference.
   * @example "actions/checkout@v2"
   */
  readonly uses: string;

  /**
   * Input parameters for the action, passed as a key-value map.
   * @example { "token": "${{ secrets.GITHUB_TOKEN }}" }
   */
  readonly parameters?: Record<string, unknown>;
}

/**
 * Base class representing a single step within a GitHub Actions job.
 */
export abstract class StepBase extends Component {
  /**
   * Checks if an object is an instance of `StepBase`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `StepBase`; otherwise, `false`.
   */
  public static isStepBase(x: unknown): x is StepBase {
    return x !== null && typeof x === "object" && STEP_BASE_SYMBOL in x;
  }

  public readonly name?: string; // Name of the step
  public readonly condition?: string; // Conditional execution expression
  public readonly env?: Record<string, string>; // Environment variables for this step
  public readonly continueOnError?: boolean; // Continue on error flag
  public readonly timeoutMinutes?: number; // Step timeout in minutes

  /**
   * Creates a new `StepBase` instance.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this step.
   */
  constructor(scope: IConstruct, id: string, props: CommonStepProps) {
    super(scope, id);

    // Mark the construct scope with STEP_BASE_SYMBOL to denote it's a StepBase
    Object.defineProperty(this, STEP_BASE_SYMBOL, { value: true });

    this.name = props.name;
    this.condition = props.condition;
    this.env = props.env;
    this.continueOnError = props.continueOnError;
    this.timeoutMinutes = props.timeoutMinutes;
  }

  /**
   * Retrieves the step's unique identifier within the context of a workflow job.
   * @returns The unique identifier for this step.
   */
  public get id(): string {
    return this.node.id;
  }
}

/**
 * Step that runs shell commands in a GitHub Actions job.
 */
export class RunStep extends StepBase {
  /**
   * Checks if an object is an instance of `RunStep`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `RunStep`; otherwise, `false`.
   */
  public static isRunStep(x: unknown): x is RunStep {
    return x !== null && typeof x === "object" && RUN_STEP_SYMBOL in x;
  }

  public readonly run: string[]; // Commands to execute in the step
  public readonly workingDirectory?: string; // Directory for execution
  public readonly shell?: ShellType; // Shell type for execution

  /**
   * Creates a new `RunStep` instance.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this run step.
   */
  constructor(scope: IConstruct, id: string, props: RunStepProps) {
    super(scope, id, props);

    Object.defineProperty(this, RUN_STEP_SYMBOL, { value: true });

    // Ensure the run property is always an array
    this.run = typeof props.run === "string" ? [props.run] : props.run;
    this.workingDirectory = props.workingDirectory;
    this.shell = props.shell;

    // Validation for the shell type
    this.node.addValidation({
      validate: () => {
        const errors: string[] = [];
        if (this.shell && !validShells.includes(this.shell as ShellType)) {
          errors.push(`'shell' must be one of the following: ${validShells.join(", ")}.`);
        }
        return errors;
      },
    });
  }

  /**
   * Serializes the `RunStep` configuration to an object for GitHub Actions YAML output.
   *
   * Converts the run step configuration into an object format suitable for
   * GitHub Actions YAML serialization.
   *
   * @returns An object suitable for YAML serialization.
   * @internal
   * @override
   */
  public _toRecord(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      if: this.condition,
      run: this.run.join("\n"),
      env: this.env,
      continueOnError: this.continueOnError,
      timeoutMinutes: this.timeoutMinutes,
      workingDirectory: this.workingDirectory,
      shell: this.shell,
    };
  }
}

/**
 * Step that runs a predefined GitHub Action within a job.
 */
export class RegularStep extends StepBase {
  /**
   * Checks if an object is an instance of `RegularStep`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `RegularStep`; otherwise, `false`.
   */
  public static isRegularStep(x: unknown): x is RegularStep {
    return x !== null && typeof x === "object" && REGULAR_STEP_SYMBOL in x;
  }

  public readonly uses: string; // Reference to the GitHub Action
  public readonly parameters?: Record<string, unknown>; // Input parameters for the action

  /**
   * Creates a new `RegularStep` instance.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this regular step.
   */
  constructor(scope: IConstruct, id: string, props: RegularStepProps) {
    super(scope, id, props);

    Object.defineProperty(this, REGULAR_STEP_SYMBOL, { value: true });

    this.uses = props.uses;
    this.parameters = props.parameters;
  }

  /**
   * Determines if the action is an external action.
   *
   * @returns `true` if the action is an external action; otherwise, `false`.
   */
  public isExternalAction(): boolean {
    return !this.isRepoAction() && !this.isDockerAction();
  }

  /**
   * Determines if the action is a repository action.
   *
   * @returns `true` if the action is a repository action; otherwise, `false`.
   */
  public isRepoAction(): boolean {
    return this.uses.startsWith("./");
  }

  /**
   * Determines if the action is a Docker action.
   *
   * @returns `true` if the action is a Docker action; otherwise, `false`.
   */
  public isDockerAction(): boolean {
    return this.uses.startsWith("docker://");
  }

  /**
   * Serializes the `RegularStep` configuration to an object for GitHub Actions YAML output.
   *
   * Converts the step configuration into an object format suitable for
   * GitHub Actions YAML serialization.
   *
   * @returns An object suitable for YAML serialization.
   * @internal
   * @override
   */
  public _toRecord(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      if: this.condition,
      uses: this.uses,
      with: cleanObject(this.parameters),
      env: this.env,
      continueOnError: this.continueOnError,
      timeoutMinutes: this.timeoutMinutes,
    };
  }
}

export function parseExternalActionName(name: string): {
  owner: string;
  repo: string;
  ref: string;
} {
  const regex = /^([^\/]+)\/([^@]+)@(.+)$/;
  const match = name.match(regex);

  if (!match) {
    throw new Error(`Invalid repository reference: ${name}`);
  }

  const owner = match[1]; // The owner (e.g., "octocat")
  const repo = match[2]; // The repository name (e.g., "Hello-World")
  const ref = match[3]; // The reference (e.g., "main", "v1.0", "a1b2c3d")

  return { owner, repo, ref };
}

export function parseDockerActionName(name: string): { host: string; image: string; tag: string } {
  const regex = /^docker:\/\/([^\/]+)\/([^:]+)(?::(.*))?$/;
  const match = name.match(regex);

  if (!match) {
    throw new Error(`Invalid Docker action name: ${name}`);
  }

  const host = match[1]; // The host (e.g., docker.io)
  const image = match[2]; // The image name (e.g., library/ubuntu)
  const tag = match[3] || "latest"; // The tag (e.g., 20.04), defaults to 'latest' if not provided

  return { host, image, tag };
}

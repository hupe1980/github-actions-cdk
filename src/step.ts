import type { IConstruct } from "constructs";
import { Component } from "./component";
import { cleanObject } from "./private/utils";

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

const validShells = ["bash", "sh", "python", "cmd", "pwsh", "powershell"] as const;

type ShellType = (typeof validShells)[number];

/**
 * Configuration for a step that runs a shell command.
 */
export interface RunStepProps extends CommonStepProps {
  /**
   * Commands or scripts to execute in this step.
   * @example ["npm", "install"]
   */
  readonly run?: string | string[];

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
  readonly uses?: string;

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
  public readonly name?: string;
  public readonly condition?: string;
  public readonly env?: Record<string, string>;
  public readonly continueOnError?: boolean;
  public readonly timeoutMinutes?: number;

  /**
   * Creates a new `StepBase` instance.
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this step.
   */
  constructor(scope: IConstruct, id: string, props: CommonStepProps) {
    super(scope, id);

    this.name = props.name;
    this.condition = props.condition;
    this.env = props.env;
    this.continueOnError = props.continueOnError;
    this.timeoutMinutes = props.timeoutMinutes;
  }

  /**
   * Retrieves the step's unique identifier within the context of a workflow job.
   */
  public get id(): string {
    return this.node.id;
  }
}

/**
 * Step that runs shell commands in a GitHub Actions job.
 */
export class RunStep extends StepBase {
  public readonly run?: string[];
  public readonly workingDirectory?: string;
  public readonly shell?: string;

  /**
   * Creates a new `RunStep` instance.
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this run step.
   */
  constructor(scope: IConstruct, id: string, props: RunStepProps) {
    super(scope, id, props);

    this.run = typeof props.run === "string" ? [props.run] : props.run;
    this.workingDirectory = props.workingDirectory;
    this.shell = props.shell;

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
      run: this.run?.join("\n"),
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
  public readonly uses?: string;
  public readonly parameters?: Record<string, unknown>;

  /**
   * Creates a new `RegularStep` instance.
   * @param scope - The scope in which to define this construct.
   * @param id - The unique identifier for this step.
   * @param props - Configuration properties for this regular step.
   */
  constructor(scope: IConstruct, id: string, props: RegularStepProps) {
    super(scope, id, props);

    this.uses = props.uses;
    this.parameters = props.parameters;
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

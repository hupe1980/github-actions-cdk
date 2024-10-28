import type { IConstruct } from "constructs";
import type { Action } from "./action";
import { Component } from "./component";
import type { Defaults } from "./defaults";
import type { Permissions } from "./permissions";
import { RegularStep, type RegularStepProps, RunStep, type RunStepProps, StepBase } from "./step";

// Unique symbol used to mark an object as a Job
const JOB_SYMBOL = Symbol.for("github-actions-cdk.Job");

/**
 * Defines a matrix of configurations for job variations.
 */
export interface Matrix {
  /**
   * Defines the domain of values for job matrix keys.
   *
   * Each key in this object becomes a variable in the matrix context, allowing
   * for the creation of jobs for each value. For example, the key `os` can
   * include an array of operating systems, enabling `matrix.os` to define the `runs-on`
   * target for each job.
   */
  readonly domain?: Record<string, string[]>;

  /**
   * Allows additional configuration in the matrix.
   *
   * Adds specified values to a matrix configuration. Useful for adding specific
   * settings to certain configurations in the matrix, like different Node.js versions
   * or OS types.
   */
  readonly include?: Array<Record<string, string>>;

  /**
   * Excludes specific configurations from the matrix.
   *
   * Using `exclude`, you can remove a job that would otherwise be created by the matrix.
   */
  readonly exclude?: Array<Record<string, string>>;
}

/**
 * Defines a job strategy, including matrix configurations and concurrency controls.
 */
export interface Strategy {
  /**
   * Matrix strategy for generating multiple job configurations.
   *
   * Matrix configurations enable variations in job definitions, such as testing
   * different OS or programming language versions.
   */
  readonly matrix?: Matrix;

  /**
   * Controls job cancellation when one matrix job fails.
   *
   * When true, cancels all in-progress jobs if any matrix job fails. Default: true.
   */
  readonly failFast?: boolean;

  /**
   * Maximum number of parallel jobs in the matrix.
   *
   * Limits how many jobs run simultaneously in the matrix to control resource usage.
   */
  readonly maxParallel?: number;
}

/**
 * Properties for configuring a GitHub Actions job.
 */
export interface JobProps {
  readonly name?: string; // Display name for the job in the GitHub Actions UI
  readonly env?: Record<string, string>; // Environment variables for all job steps
  readonly defaults?: Defaults; // Default settings for job steps
  readonly needs?: string[]; // Job dependencies that must complete before this job
  readonly permissions?: Permissions; // Permissions granted to the job
  readonly environment?: unknown; // Target GitHub environment
  readonly outputs?: Record<string, string>; // Outputs to be accessed by downstream jobs
  readonly runsOn?: string[] | string; // Runner environment, e.g., "ubuntu-latest"
  readonly timeoutMinutes?: number; // Timeout limit for the job
  readonly strategy?: Strategy; // Job strategy, including matrix configurations
  readonly runnerLabels?: string | string[]; // Labels for self-hosted runner selection
  readonly requiredChecks?: string[]; // Required checks to pass before running the job
}

/**
 * Represents a GitHub Actions job, containing configurations, steps, and dependencies.
 *
 * Jobs are composed of steps and run in a specified environment with
 * defined permissions, environment variables, and strategies.
 */
export class Job extends Component {
  /**
   * Checks if an object is an instance of `Job`.
   *
   * @param x - The object to check.
   * @returns `true` if `x` is a `Job`; otherwise, `false`.
   */
  public static isJob(x: unknown): x is Job {
    return x !== null && typeof x === "object" && JOB_SYMBOL in x;
  }

  public readonly name?: string;
  public readonly env?: Record<string, string>;
  public readonly defaults?: Defaults;
  public readonly needs?: string[];
  public readonly permissions?: Permissions;
  public readonly environment?: unknown;
  public readonly runsOn: string[] | string;
  public readonly timeoutMinutes?: number;
  public readonly strategy?: Strategy;
  public readonly runnerLabels?: string | string[];
  public readonly requiredChecks?: string[];

  private _outputs?: Record<string, string>;

  /**
   * Creates a new Job instance.
   *
   * @param scope - The construct scope for this job.
   * @param id    - A unique identifier for the job.
   * @param props - Properties defining job configurations.
   */
  constructor(scope: IConstruct, id: string, props: JobProps) {
    super(scope, id);

    // Mark the construct scope with JOB_SYMBOL to denote it's a Job
    Object.defineProperty(this, JOB_SYMBOL, { value: true });

    this.name = props.name;
    this.env = props.env;
    this.defaults = props.defaults;
    this.needs = props.needs;
    this.permissions = props.permissions;
    this.environment = props.environment;
    this.runsOn = props.runsOn ?? "ubuntu-latest";
    this.timeoutMinutes = props.timeoutMinutes;
    this.strategy = props.strategy;
    this.runnerLabels = props.runnerLabels;
    this.requiredChecks = props.requiredChecks;
    this._outputs = props.outputs;

    this.node.addValidation({validate: () => {
      const errors: string[] = [];

      if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(this.id)) {
        errors.push(`Job id "${this.id}" is invalid. It must match the pattern ^[a-zA-Z_][a-zA-Z0-9_-]*$`);
      }

      return errors;
    }});
  }

  /**
   * Retrieves the job's unique identifier.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Retrieves defined outputs for the job.
   *
   * @returns A record of outputs if defined, otherwise undefined.
   */
  get outputs(): Record<string, string> | undefined {
    return this._outputs;
  }

  /**
   * Adds an output to the job, accessible by downstream jobs.
   *
   * @param name - The output name.
   * @param value - The output value.
   */
  public addOutput(name: string, value: string): void {
    if (!this._outputs) {
      this._outputs = {};
    }
    this._outputs[name] = value;
  }

  /**
   * Adds a `RunStep` to the job.
   *
   * A `RunStep` allows defining shell commands to execute within the job.
   *
   * @param id - The unique ID of the step.
   * @param props - Configuration for the `RunStep`.
   * @returns The created `RunStep` instance.
   */
  public addRunStep(id: string, props: RunStepProps): RunStep {
    return new RunStep(this, id, props);
  }

  /**
   * Adds a `RegularStep` to the job.
   *
   * A `RegularStep` is used for predefined GitHub Actions steps.
   *
   * @param id - The unique ID of the step.
   * @param props - Configuration for the `RegularStep`.
   * @returns The created `RegularStep` instance.
   */
  public addRegularStep(id: string, props: RegularStepProps): RegularStep {
    return new RegularStep(this, id, props);
  }

  /**
   * Adds a generic step to the job, selecting between `RunStep` or `RegularStep`.
   *
   * @param id - The step ID.
   * @param props - Properties for either `RunStep` or `RegularStep`.
   * @returns A `StepBase` instance, depending on the provided properties.
   */
  public addStep(id: string, props: RunStepProps | RegularStepProps): StepBase {
    return "run" in props
      ? new RunStep(this, id, props as RunStepProps)
      : new RegularStep(this, id, props as RegularStepProps);
  }

  /**
   * Binds an action to the job.
   *
   * Actions are reusable workflows defined in separate files or repositories.
   *
   * @param action - The action to bind to the job.
   */
  public addAction(action: Action): void {
    action.bind(this);
  }

  /**
   * Serializes the job configuration for GitHub Actions.
   *
   * Converts the job and its steps into an object format suitable for
   * GitHub Actions YAML configuration.
   *
   * @returns An object representing the serialized job configuration.
   * @internal
   * @override
   */
  public _toRecord(): Record<string, unknown> {
    const steps = this.node.findAll().filter((n) => n instanceof StepBase) as StepBase[];

    const jobConfig: Record<string, unknown> = {
      [this.id]: {
        name: this.name,
        "runs-on": this.runsOn,
        env: this.env,
        defaults: this.defaults,
        needs: this.needs,
        permissions: this.permissions,
        environment: this.environment,
        outputs: this._outputs,
        steps: steps.map((step) => step._synth()),
        "timeout-minutes": this.timeoutMinutes,
        strategy: this.strategy,
        "runner-labels": this.runnerLabels,
        "required-checks": this.requiredChecks,
      },
    };

    return jobConfig;
  }
}

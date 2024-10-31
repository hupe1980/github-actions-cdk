import type { IConstruct } from "constructs";
import { Component } from "./component";
import type { Defaults } from "./defaults";
import type { Permissions } from "./permissions";
import { snakeCaseKeys } from "./private/utils";
import { RegularStep, type RegularStepProps, RunStep, type RunStepProps, StepBase } from "./step";
import { JobValidator } from "./validator";

// Unique symbol used to mark an object as a Job
const JOB_SYMBOL = Symbol.for("github-actions-cdk.Job");

/**
 * Defines a configuration matrix for variations of a job.
 *
 * The matrix feature allows setting up multiple configurations in a job, each with
 * different parameters. GitHub Actions will create a unique job for each configuration.
 */
export interface Matrix {
  /**
   * Key-value pairs for matrix configuration, where each key can contain
   * multiple values, producing unique jobs for each combination.
   */
  readonly domain?: Record<string, string[]>;

  /**
   * Specific configurations to include in the matrix.
   * Each entry is a configuration object added to the job matrix.
   */
  readonly include?: Array<Record<string, string>>;

  /**
   * Specific configurations to exclude from the matrix.
   * Useful for avoiding certain configurations from running.
   */
  readonly exclude?: Array<Record<string, string>>;
}

/**
 * Defines a strategy for job execution, including matrix and concurrency settings.
 */
export interface Strategy {
  /**
   * Configuration matrix for job variations.
   */
  readonly matrix?: Matrix;

  /**
   * Cancels all in-progress matrix jobs if one fails.
   * @default true
   */
  readonly failFast?: boolean;

  /**
   * Limits the number of concurrent jobs in the matrix.
   */
  readonly maxParallel?: number;
}

/**
 * Credentials for authenticating with Docker registries.
 */
export interface ContainerCredentials {
  /** Docker registry username. */
  readonly username: string;

  /** Docker registry password. */
  readonly password: string;
}

/**
 * Configuration options for a Docker container used in the job.
 */
export interface ContainerOptions {
  /** Docker image to run within the job. */
  readonly image: string;

  /**
   * Credentials for container registry authentication.
   */
  readonly credentials?: ContainerCredentials;

  /**
   * Environment variables set within the container.
   */
  readonly env?: Record<string, string>;

  /**
   * Ports exposed by the container.
   */
  readonly ports?: number[];

  /**
   * Volumes attached to the container, enabling data sharing.
   * Each entry specifies a `<source>:<destinationPath>` mapping.
   */
  readonly volumes?: string[];

  /**
   * Additional Docker options for the container.
   * Refer to Docker's documentation for a list of supported options.
   *
   * @see https://docs.docker.com/engine/reference/commandline/create/#options
   */
  readonly options?: string[];
}

/**
 * Properties for configuring a GitHub Actions job.
 */
export interface JobProps {
  /** Display name for the job. */
  readonly name?: string;

  /** Environment variables for all steps in the job. */
  readonly env?: Record<string, string>;

  /** Default configuration settings for job steps. */
  readonly defaults?: Defaults;

  /** List of job dependencies that must complete before this job starts. */
  readonly needs?: string[];

  /** Permissions granted to the job. */
  readonly permissions?: Permissions;

  /** GitHub environment target for this job. */
  readonly environment?: unknown;

  /** Outputs produced by this job, accessible by downstream jobs. */
  readonly outputs?: Record<string, string>;

  /** Runner environment, e.g., "ubuntu-latest". */
  readonly runsOn?: string[] | string;

  /** Timeout duration for the job, in minutes. */
  readonly timeoutMinutes?: number;

  /** Strategy settings, including matrix configuration and concurrency limits. */
  readonly strategy?: Strategy;

  /**
   * Prevents a workflow run from failing when a job fails. Set to true to
   * allow a workflow run to pass when this job fails.
   */
  readonly continueOnError?: boolean;

  /**
   * A container to run any steps in a job that don't already specify a
   * container. If you have steps that use both script and container actions,
   * the container actions will run as sibling containers on the same network
   * with the same volume mounts.
   */
  readonly container?: ContainerOptions;

  /**
   * Used to host service containers for a job in a workflow. Service
   * containers are useful for creating databases or cache services like Redis.
   * The runner automatically creates a Docker network and manages the life
   * cycle of the service containers.
   */
  readonly services?: Record<string, ContainerOptions>;

  /** Runner labels for selecting a self-hosted runner. */
  readonly runnerLabels?: string | string[];

  /** List of checks required to pass before this job runs. */
  readonly requiredChecks?: string[];
}

/**
 * Represents a GitHub Actions job, containing configurations, steps, and dependencies.
 *
 * Jobs are composed of steps and run within a specified environment with defined
 * permissions, environment variables, and strategies.
 */
export class Job extends Component {
  /**
   * Checks if an object is an instance of `Job`.
   * @param x - The object to check.
   * @returns `true` if `x` is a `Job`; otherwise, `false`.
   */
  public static isJob(x: unknown): x is Job {
    return x !== null && typeof x === "object" && JOB_SYMBOL in x;
  }

  public readonly name?: string;
  public readonly env?: Record<string, string>;
  public readonly defaults?: Defaults;
  public readonly permissions?: Permissions;
  public readonly environment?: unknown;
  public readonly runsOn: string[] | string;
  public readonly timeoutMinutes?: number;
  public readonly strategy?: Strategy;
  public readonly continueOnError?: boolean;
  public readonly container?: ContainerOptions;
  public readonly services?: Record<string, ContainerOptions>;
  public readonly runnerLabels?: string | string[];
  public readonly requiredChecks?: string[];

  private _needs: Set<string>;
  private _outputs?: Record<string, string>;

  /**
   * Initializes a new instance of the `Job` class.
   * @param scope - Construct scope for the job.
   * @param id - Unique identifier for the job.
   * @param props - Configuration properties for the job.
   */
  constructor(scope: IConstruct, id: string, props: JobProps = {}) {
    super(scope, id);

    Object.defineProperty(this, JOB_SYMBOL, { value: true });

    this.name = props.name;
    this.env = props.env;
    this.defaults = props.defaults;
    this.permissions = props.permissions;
    this.environment = props.environment;
    this.runsOn = props.runsOn ?? "ubuntu-latest";
    this.timeoutMinutes = props.timeoutMinutes;
    this.strategy = props.strategy;
    this.continueOnError = props.continueOnError;
    this.container = props.container;
    this.services = props.services;
    this.runnerLabels = props.runnerLabels;
    this.requiredChecks = props.requiredChecks;

    this._needs = new Set(props.needs ?? []);
    this._outputs = props.outputs;

    this.node.addValidation(new JobValidator(this));
  }

  /** Retrieves the unique identifier for the job. */
  public get id(): string {
    return this.node.id;
  }

  /** Retrieves the job's defined outputs, if any. */
  public get outputs(): Record<string, string> | undefined {
    return this._outputs;
  }

  /** Retrieves job dependencies. */
  public get needs(): string[] {
    return Array.from(this._needs);
  }

  /**
   * Checks if the current job contains any steps.
   *
   * This method iterates through the children of the node associated with
   * the job and checks if any of those children are instances of StepBase.
   * If at least one child is a step, the method returns true; otherwise, it
   * returns false.
   *
   * @returns True if the job has one or more steps; otherwise, false.
   */
  public hasSteps(): boolean {
    return this.node.findAll().some((child) => StepBase.isStepBase(child));
  }

  /**
   * Adds an output accessible by downstream jobs.
   * @param name - Name of the output.
   * @param value - Value for the output.
   */
  public addOutput(name: string, value: string): void {
    if (!this._outputs) {
      this._outputs = {};
    }
    this._outputs[name] = value;
  }

  /**
   * Adds a `RunStep` to the job.
   * @param id - Unique ID for the step.
   * @param props - Properties for the `RunStep`.
   * @returns Created `RunStep` instance.
   */
  public addRunStep(id: string, props: RunStepProps): RunStep {
    return new RunStep(this, id, props);
  }

  /**
   * Adds a `RegularStep` to the job.
   * @param id - Unique ID for the step.
   * @param props - Properties for the `RegularStep`.
   * @returns Created `RegularStep` instance.
   */
  public addRegularStep(id: string, props: RegularStepProps): RegularStep {
    return new RegularStep(this, id, props);
  }

  /**
   * Adds a dependency to another job, which must complete first.
   * @param job - Job to depend on.
   */
  public addDependency(job: Job): void {
    this._needs.add(job.id);
  }

  /**
   * Serializes the job configuration for GitHub Actions YAML.
   * @returns An object representing the job configuration.
   * @internal
   * @override
   */
  public _toRecord(): Record<string, unknown> {
    const steps = this.node.findAll().filter((n) => n instanceof StepBase) as StepBase[];

    return {
      [this.id]: snakeCaseKeys({
        name: this.name,
        runsOn: this.runsOn,
        env: this.env,
        defaults: this.defaults,
        needs: this._needs.size > 0 ? this.needs : undefined,
        permissions: this.permissions,
        environment: this.environment,
        outputs: this._outputs,
        steps: steps.map((step) => step._synth()),
        timeoutMinutes: this.timeoutMinutes,
        strategy: this.strategy,
        container: this.container,
        services: this.services,
        runnerLabels: this.runnerLabels,
        requiredChecks: this.requiredChecks,
      }),
    };
  }
}

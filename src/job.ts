import type { IConstruct } from "constructs";
import type { Action, ActionOutputs } from "./action";
import { Component } from "./component";
import type { Defaults } from "./defaults";
import type { Permissions } from "./permissions";
import { Step, type StepProps } from "./step";

export interface Matrix {
  /**
   * Each option you define in the matrix has a key and value. The keys you
   * define become properties in the matrix context and you can reference the
   * property in other areas of your workflow file. For example, if you define
   * the key os that contains an array of operating systems, you can use the
   * matrix.os property as the value of the runs-on keyword to create a job
   * for each operating system.
   */
  readonly domain?: Record<string, string[]>;

  /**
   * You can add additional configuration options to a build matrix job that
   * already exists. For example, if you want to use a specific version of npm
   * when the job that uses windows-latest and version 8 of node runs, you can
   * use include to specify that additional option.
   */
  readonly include?: Array<Record<string, string>>;

  /**
   * You can remove a specific configurations defined in the build matrix
   * using the exclude option. Using exclude removes a job defined by the
   * build matrix.
   */
  readonly exclude?: Array<Record<string, string>>;
}

export interface Strategy {
  /**
   * You can define a matrix of different job configurations. A matrix allows
   * you to create multiple jobs by performing variable substitution in a
   * single job definition. For example, you can use a matrix to create jobs
   * for more than one supported version of a programming language, operating
   * system, or tool. A matrix reuses the job's configuration and creates a
   * job for each matrix you configure.
   *
   * A job matrix can generate a maximum of 256 jobs per workflow run. This
   * limit also applies to self-hosted runners.
   */
  readonly matrix?: Matrix;

  /**
   * When set to true, GitHub cancels all in-progress jobs if any matrix job
   * fails. Default: true
   */
  readonly failFast?: boolean;

  /**
   * The maximum number of jobs that can run simultaneously when using a
   * matrix job strategy. By default, GitHub will maximize the number of jobs
   * run in parallel depending on the available runners on GitHub-hosted
   * virtual machines.
   */
  readonly maxParallel?: number;
}

/**
 * Configuration properties for a GitHub Actions job.
 */
export interface JobProps {
  /**
   * The display name of the job in GitHub Actions.
   *
   * This name will appear in the Actions interface to represent this job.
   */
  readonly name?: string;

  /**
   * Environment variables available to all steps in the job.
   *
   * A key-value map of environment variables that are accessible by all steps
   * within this job. Individual steps or the entire workflow can also set environment
   * variables to further customize the environment.
   *
   * @example
   * env: { NODE_ENV: "production" }
   */
  readonly env?: Record<string, string>;

  /**
   * Default settings to apply to all steps in the job.
   *
   * These settings provide default values for `shell`, `workingDirectory`, and other
   * options for each step in the job, allowing for consistent configuration across steps.
   * Job-level defaults can override workflow-level defaults, but can be overridden by
   * individual step settings.
   */
  readonly defaults?: Defaults;

  /**
   * Specifies any jobs that must complete before this job runs.
   *
   * This property establishes dependencies between jobs, ensuring that
   * specified jobs complete successfully before this job is initiated. It can
   * be a string or an array of job IDs.
   *
   * @example
   * needs: ["build", "test"]
   */
  readonly needs?: string[];

  /**
   * Defines the permissions for this job.
   *
   * Use this to control the access levels and permissions available to the job,
   * restricting or granting permissions for specific GitHub actions and resources.
   */
  readonly permissions?: Permissions;

  /**
   * The environment this job targets.
   *
   * Specifies the GitHub environment referenced by this job. The job will be subject
   * to any environment protection rules configured in the repository, such as approvals
   * or restrictions.
   *
   * @see https://docs.github.com/en/actions/reference/environments
   */
  readonly environment?: unknown;

  /**
   * Defines outputs for the job that can be accessed by downstream jobs.
   *
   * A map of outputs produced by this job, which are accessible to other jobs
   * that depend on it via the `needs` keyword.
   *
   * @example
   * outputs: { artifact_path: "/path/to/artifact" }
   */
  readonly outputs?: Record<string, string>;

  /**
   * The type of runner on which to execute the job.
   *
   * Defines the runner environment for the job, which can be either a GitHub-hosted
   * or self-hosted runner. GitHub-hosted runners include options such as `"ubuntu-latest"`,
   * `"windows-latest"`, and `"macos-latest"`.
   *
   * @example
   * runsOn: "ubuntu-latest"
   * @example
   * runsOn: ["self-hosted", "linux", "x64"]
   */
  readonly runsOn?: string[] | string;

  /**
   * The timeout in minutes for the job to complete.
   *
   * This defines how long GitHub Actions should wait for the job to finish
   * before it is automatically canceled. This helps in managing long-running jobs.
   *
   * @default 60
   * @example
   * timeoutMinutes: 30
   */
  readonly timeoutMinutes?: number;

  /**
   * The strategy for running this job.
   *
   * Allows you to specify a matrix strategy to run the job multiple times with different
   * configurations, like different Node.js versions or OS types.
   *
   * @example
   * strategy: { matrix: { node: [10, 12, 14] } }
   */
  readonly strategy?: Strategy;

  /**
   * Specifies the job's runner labels.
   *
   * This allows you to filter runners by labels, which is particularly useful for
   * self-hosted runners. You can provide a single label or an array of labels.
   *
   * @example
   * runnerLabels: ["linux", "x64"]
   */
  readonly runnerLabels?: string | string[];

  /**
   * A set of required checks that must pass before the job can run.
   *
   * Useful for ensuring that certain status checks are completed before
   * executing this job, improving the reliability of the workflow.
   *
   * @example
   * requiredChecks: ["ci/check1", "ci/check2"]
   */
  readonly requiredChecks?: string[];
}

/**
 * Represents a GitHub Actions job, including configuration and steps.
 *
 * A job consists of multiple steps that execute within a specified runner environment,
 * with access to defined environment variables, default settings, and permissions. The
 * `Job` class allows for the addition of steps and actions, and manages job dependencies
 * and environment configurations.
 */
export class Job extends Component {
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
   * @param scope - The scope in which to define this construct.
   * @param id    - The unique identifier for the job within the workflow.
   * @param props - Configuration properties for the job.
   */
  constructor(scope: IConstruct, id: string, props: JobProps) {
    super(scope, id);

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
  }

  /**
   * Retrieves the unique identifier for this job.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Retrieves the outputs defined for this job.
   *
   * @returns A map of output names to their values.
   */
  get outputs(): Record<string, string> | undefined {
    return this._outputs;
  }

  /**
   * Adds an output to the job.
   *
   * Outputs can be used by downstream jobs that depend on this job.
   *
   * @param name - The name of the output.
   * @param value - The value of the output.
   */
  public addOutput(name: string, value: string): void {
    if (!this._outputs) {
      this._outputs = {};
    }
    this._outputs[name] = value;
  }

  /**
   * Adds a step to the job.
   *
   * Each step defines a specific command or set of commands to be executed in sequence within the job.
   *
   * @param id - The id of the step.
   * @param props - The properties and configuration for the step.
   * @returns The newly created step instance.
   */
  public addStep(id: string, props: StepProps): Step {
    return new Step(this, id, props);
  }

  /**
   * Binds an action to this job.
   *
   * Associates the specified action with this job, applying its configuration
   * and behavior to the job's steps.
   *
   * @param action - The action to bind to the job.
   */
  public addAction<T extends ActionOutputs>(action: Action<T>): void {
    action.bind(this);
  }

  /**
   * Serializes the job configuration to an object suitable for workflow YAML output.
   *
   * This method iterates through all associated steps and constructs the final job
   * configuration, including environment variables, defaults, permissions, and other settings.
   *
   * @returns An object representing the job configuration.
   * @internal
   */
  public _toObject(): Record<string, unknown> {
    const steps = new Array<Step>();
    this.node.findAll().map((n) => {
      if (n instanceof Step) {
        steps.push(n);
      }
    });

    const job: Record<string, unknown> = {
      [this.id]: {
        name: this.name,
        "runs-on": this.runsOn,
        env: this.env,
        defaults: this.defaults,
        needs: this.needs,
        permissions: this.permissions,
        environment: this.environment,
        outputs: this._outputs,
        steps: steps.map((step) => step._toObject()),
        "timeout-minutes": this.timeoutMinutes,
        strategy: this.strategy,
        "runner-labels": this.runnerLabels,
        "required-checks": this.requiredChecks,
      },
    };

    return job;
  }
}

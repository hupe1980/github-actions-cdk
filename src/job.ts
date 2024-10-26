import type { IConstruct } from "constructs";
import type { Action } from "./action";
import { Component } from "./component";
import type { Defaults } from "./defaults";
import type { Permissions } from "./permissions";
import { Step, type StepProps } from "./step";

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
  }

  /**
   * Retrieves the unique identifier for this job.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Adds a step to the job.
   *
   * Each step defines a specific command or set of commands to be executed in sequence within the job.
   *
   * @param name - The name of the step.
   * @param props - The properties and configuration for the step.
   * @returns The newly created step instance.
   */
  public addStep(name: string, props: StepProps): Step {
    return new Step(this, name, props);
  }

  /**
   * Binds an action to this job.
   *
   * Associates the specified action with this job, applying its configuration
   * and behavior to the job's steps.
   *
   * @param action - The action to bind to the job.
   */
  public addAction(action: Action): void {
    action.bind(this);
  }

  /**
   * Serializes the job configuration to an object suitable for workflow YAML output.
   *
   * This method iterates through all associated steps and constructs the final job
   * configuration, including environment variables, defaults, permissions, and other settings.
   *
   * @returns An object representing the job configuration.
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
        steps: steps.map((step) => step._toObject()),
      },
    };

    return job;
  }
}

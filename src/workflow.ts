import type { IConstruct } from "constructs";
import { Component } from "./component";
import type { ConcurrencyOptions } from "./concurrency";
import type { Defaults } from "./defaults";
import { Job, type JobProps } from "./job";
import type { Permissions } from "./permissions";
import { snakeCaseKeys } from "./private/utils";
import { type IWorkflowSynthesizer, WorkflowSynthesizer } from "./synthesizer";
import type { WorkflowTriggers } from "./trigger";
import { WorkflowValidator } from "./validator";

// Unique symbol used to mark an object as a Workflow
const WORKFLOW_SYMBOL = Symbol.for("github-actions-cdk.Workflow");

/** Workflow configuration properties. */
export interface WorkflowProps {
  /**
   * The name of the workflow.
   *
   * GitHub displays the names of your workflows under your repository's "Actions" tab.
   * If you omit the name, GitHub displays the workflow file path relative to the root of the repository.
   *
   * @example "CI/CD Pipeline"
   */
  readonly name?: string;

  /**
   * The name for workflow runs generated from the workflow.
   *
   * GitHub displays the workflow run name in the list of workflow runs on your repository's "Actions" tab.
   * If `run-name` is omitted or is only whitespace, then the run name is set to event-specific
   * information for the workflow run. For example, for a workflow triggered by a `push` or
   * `pull_request` event, it is set as the commit message or the title of the pull request.
   *
   * This value can include expressions and can reference the `github` and `inputs` contexts.
   *
   * @example
   * run-name: Deploy to ${{ inputs.deploy_target }} by @${{ github.actor }}
   */
  readonly runName?: string;

  /**
   * Triggers that define when this workflow should run.
   */
  readonly triggers?: WorkflowTriggers;

  /**
   * Environment variables that will be available to all jobs in the workflow.
   */
  readonly env?: Record<string, string>;

  /**
   * Default configuration settings for jobs in this workflow.
   */
  readonly defaults?: Defaults;

  /**
   * Permissions required by the workflow.
   */
  readonly permissions?: Permissions;

  /**
   * Configuration for concurrency control of workflow runs.
   */
  readonly concurrency?: ConcurrencyOptions;

  /**
   * Custom synthesizer for rendering the workflow YAML.
   */
  readonly synthesizer?: IWorkflowSynthesizer;
}

/**
 * Represents a GitHub Workflow.
 * This class defines the workflow, its triggers, environment variables,
 * defaults, permissions, concurrency settings, and allows for job creation.
 */
export class Workflow extends Component {
  /**
   * Checks if an object is an instance of `Workflow`.
   * @param x - The object to check.
   * @returns `true` if `x` is a `workflow`; otherwise, `false`.
   */
  public static isWorkflow(x: unknown): x is Job {
    return x !== null && typeof x === "object" && WORKFLOW_SYMBOL in x;
  }

  /**
   * The name of the workflow as displayed in GitHub Actions.
   */
  public readonly name?: string;

  /**
   * The run name of the workflow, displayed in the GitHub Actions UI.
   */
  public readonly runName?: string;

  /**
   * The triggers for the workflow.
   */
  public readonly triggers: WorkflowTriggers;

  /**
   * Environment variables available to all jobs in the workflow.
   */
  public readonly env?: Record<string, string>;

  /**
   * Default settings applied to all jobs within the workflow.
   */
  public readonly defaults?: Defaults;

  /**
   * Permissions required for the workflow to execute.
   */
  public readonly permissions?: Permissions;

  /**
   * Concurrency settings for the workflow.
   */
  public readonly concurrency?: ConcurrencyOptions;

  /**
   * Synthesizer responsible for generating the workflow YAML.
   */
  public readonly synthesizer: IWorkflowSynthesizer;

  /**
   * Initializes a new instance of the Workflow class.
   *
   * @param scope - The construct scope.
   * @param id - The unique identifier for the workflow.
   * @param props - The properties for configuring the workflow.
   * @param props.name - The name of the workflow.
   * @param props.runName - The run name of the workflow.
   * @param props.triggers - The triggers that define when the workflow runs.
   * @param props.env - Environment variables for the workflow.
   * @param props.defaults - Default configurations for jobs in the workflow.
   * @param props.permissions - Permissions required for the workflow.
   * @param props.concurrency - Concurrency settings for the workflow.
   * @param props.synthesizer - Custom synthesizer for rendering the workflow YAML.
   */
  constructor(scope: IConstruct, id: string, props: WorkflowProps = {}) {
    super(scope, id);

    Object.defineProperty(this, WORKFLOW_SYMBOL, { value: true });

    this.synthesizer = props.synthesizer ?? new WorkflowSynthesizer(this);
    this.name = props.name;
    this.runName = props.runName; // Adding runName to the constructor
    this.triggers = props.triggers ?? {
      push: { branches: ["main"] },
      workflowDispatch: {},
    };
    this.env = props.env;
    this.defaults = props.defaults;
    this.permissions = props.permissions;

    if (props.concurrency) {
      this.concurrency = {
        group: props.concurrency.group,
        cancelInProgress: props.concurrency.cancelInProgress ?? false,
      };
    }

    this.node.addValidation({
      validate: () => {
        const validator = new WorkflowValidator(this);
        validator.validate();
        return validator.errors;
      },
    });
  }

  /**
   * Gets the id of the workflow.
   *
   * @returns The unique identifier of the workflow.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Adds a new job to the workflow.
   *
   * @param id - The unique identifier of the job.
   * @param props - The properties for configuring the job.
   * @returns The created Job instance.
   */
  public addJob(id: string, props: JobProps = {}): Job {
    return new Job(this, id, props);
  }

  /**
   * Checks if the current workflow contains any jobs.
   *
   * This method iterates through the children of the node associated with
   * the workflow and checks if any of those children are instances of Job.
   * If at least one child is a job, the method returns true; otherwise, it
   * returns false.
   *
   * @returns True if the workflow has one or more jobs; otherwise, false.
   */
  public hasJobs(): boolean {
    return this.node.findAll().some((child) => Job.isJob(child));
  }

  /**
   * @internal
   * Synthesizes the workflow configuration into a record format.
   *
   * This method collects the workflow's properties, including its triggers,
   * environment variables, permissions, and jobs, and returns them as an
   * object suitable for GitHub Actions YAML output.
   *
   * @returns A record representing the workflow configuration.
   * @override
   */
  public _toRecord(): Record<string, unknown> {
    const jobs = this.node.findAll().filter((n) => n instanceof Job) as Job[];

    const workflow: Record<string, unknown> = {
      name: this.name,
      "run-name": this.runName,
      on: snakeCaseKeys(JSON.parse(JSON.stringify(this.triggers)), "_"),
      env: this.env,
      defaults: snakeCaseKeys(this.defaults),
      permissions: this.permissions,
      ...(this.concurrency && {
        concurrency: {
          group: this.concurrency.group,
          "cancel-in-progress": this.concurrency.cancelInProgress,
        },
      }),
      jobs: jobs.reduce((prev, current) => Object.assign(prev, current._synth()), {}),
    };

    return workflow;
  }
}

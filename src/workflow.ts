import type { IConstruct } from "constructs";
import { Component } from "./component";
import type { ConcurrencyOptions } from "./concurrency";
import type { Cron } from "./cron";
import type { Defaults } from "./defaults";
import { Job, type JobProps } from "./job";
import type { Permissions } from "./permissions";
import { snakeCaseKeys } from "./private/utils";
import { type IWorkflowSynthesizer, WorkflowSynthesizer } from "./synthesizer";

/**
 * Options for configuring CRON schedule.
 */
export interface CronScheduleOptions {
  /**
   * CRON expression to define workflow schedule.
   * @see https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html#tag_20_25_07
   */
  readonly cron: Cron;
}

/**
 * Options for triggering on repository dispatch events.
 */
export interface RepositoryDispatchOptions {
  /**
   * List of activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: string[];
}

/** Options for check run events. */
export interface CheckRunOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"create" | "rerequested" | "completed" | "requested_action">;
}

/** Options for check suite events. */
export interface CheckSuiteOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"completed" | "requested" | "rerequested">;
}

/** Options for issue comment events. */
export interface IssueCommentOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "edited" | "deleted">;
}

/** Options for issue events. */
export interface IssuesOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<
    | "opened"
    | "edited"
    | "deleted"
    | "transferred"
    | "pinned"
    | "unpinned"
    | "closed"
    | "reopened"
    | "assigned"
    | "unassigned"
    | "labeled"
    | "unlabeled"
    | "locked"
    | "unlocked"
    | "milestoned"
    | "demilestoned"
  >;
}

/** Options for label events. */
export interface LabelOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "edited" | "deleted">;
}

/** Options for milestone events. */
export interface MilestoneOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "closed" | "opened" | "edited" | "deleted">;
}

/** Options for project events. */
export interface ProjectOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "updated" | "closed" | "reopened" | "edited" | "deleted">;
}

/** Options for project card events. */
export interface ProjectCardOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "moved" | "converted" | "edited" | "deleted">;
}

/** Options for project column events. */
export interface ProjectColumnOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "updated" | "moved" | "deleted">;
}

/** Options for pull request events. */
export interface PullRequestOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<
    | "assigned"
    | "unassigned"
    | "labeled"
    | "unlabeled"
    | "opened"
    | "edited"
    | "closed"
    | "reopened"
    | "synchronize"
    | "ready_for_review"
    | "locked"
    | "unlocked"
    | "review_requested"
    | "review_request_removed"
  >;
}

/** Options for pull request review events. */
export interface PullRequestReviewOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"submitted" | "edited" | "dismissed">;
}

/** Options for pull request review comment events. */
export interface PullRequestReviewCommentOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"created" | "edited" | "deleted">;
}

/** Options for pull request target events. Extends push options. */
export interface PullRequestTargetOptions extends PushOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<
    | "assigned"
    | "unassigned"
    | "labeled"
    | "unlabeled"
    | "opened"
    | "edited"
    | "closed"
    | "reopened"
    | "synchronize"
    | "ready_for_review"
    | "locked"
    | "unlocked"
    | "review_requested"
    | "review_request_removed"
  >;
}

/** Options for push-like events, such as specifying branches, tags, and paths. */
export interface PushOptions {
  /**
   * Branches to trigger on. For pull requests, only base branches are evaluated.
   * @see https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet
   */
  readonly branches?: string[];

  /**
   * Tags to trigger on.
   * @default - triggers on all tags
   */
  readonly tags?: string[];

  /**
   * File path patterns to trigger on.
   * @default - triggers on all paths
   */
  readonly paths?: string[];
}

/** Options for registry package events. */
export interface RegistryPackageOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"published" | "updated">;
}

/** Options for release events. */
export interface ReleaseOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<
    "published" | "unpublished" | "created" | "edited" | "deleted" | "prereleased" | "released"
  >;
}

/** Options for watch events. */
export interface WatchOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"started">;
}

/** Options for workflow run events. */
export interface WorkflowRunOptions {
  /**
   * Activity types to trigger on.
   * @default - triggers on all activity types
   */
  readonly types?: Array<"completed" | "requested">;
}

/** Options for workflow dispatch events. */
export type WorkflowDispatchOptions = Record<string, unknown>;

/** Available triggers for GitHub Workflows. */
export interface WorkflowTriggers {
  /**
   * Schedule for running workflows at specific UTC times using POSIX cron syntax.
   */
  readonly schedule?: CronScheduleOptions[];

  /**
   * Allows for manual triggering of workflows with custom input values.
   */
  readonly workflowDispatch?: WorkflowDispatchOptions;

  /**
   * Triggers workflow based on repository dispatch events from external activities.
   */
  readonly repositoryDispatch?: RepositoryDispatchOptions;

  /**
   * Triggers workflow based on check run events.
   */
  readonly checkRun?: CheckRunOptions;

  /**
   * Triggers workflow based on check suite events.
   */
  readonly checkSuite?: CheckSuiteOptions;

  /**
   * Triggers workflow based on issue comment events.
   */
  readonly issueComment?: IssueCommentOptions;

  /**
   * Triggers workflow based on issue events.
   */
  readonly issues?: IssuesOptions;

  /**
   * Triggers workflow based on label events.
   */
  readonly label?: LabelOptions;

  /**
   * Triggers workflow based on milestone events.
   */
  readonly milestone?: MilestoneOptions;

  /**
   * Triggers workflow based on project events.
   */
  readonly project?: ProjectOptions;

  /**
   * Triggers workflow based on project card events.
   */
  readonly projectCard?: ProjectCardOptions;

  /**
   * Triggers workflow based on project column events.
   */
  readonly projectColumn?: ProjectColumnOptions;

  /**
   * Triggers workflow based on pull request events.
   */
  readonly pullRequest?: PullRequestOptions;

  /**
   * Triggers workflow based on pull request review events.
   */
  readonly pullRequestReview?: PullRequestReviewOptions;

  /**
   * Triggers workflow based on pull request review comment events.
   */
  readonly pullRequestReviewComment?: PullRequestReviewCommentOptions;

  /**
   * Triggers workflow based on pull request target events.
   */
  readonly pullRequestTarget?: PullRequestTargetOptions;

  /**
   * Triggers workflow based on push events to repository branches.
   */
  readonly push?: PushOptions;

  /**
   * Triggers workflow based on registry package publish/updates.
   */
  readonly registryPackage?: RegistryPackageOptions;

  /**
   * Triggers workflow based on release events.
   */
  readonly release?: ReleaseOptions;

  /**
   * Triggers workflow based on watch events for repositories.
   */
  readonly watch?: WatchOptions;

  /**
   * Triggers workflow based on workflow run events.
   */
  readonly workflowRun?: WorkflowRunOptions;
}

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
  constructor(scope: IConstruct, id: string, props: WorkflowProps) {
    super(scope, id);

    this.synthesizer = props.synthesizer ?? new WorkflowSynthesizer(this, false);
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
  public addJob(id: string, props: JobProps): Job {
    return new Job(this, id, props);
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

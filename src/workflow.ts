import type { IConstruct } from "constructs";
import { Component } from "./component";
import type { ConcurrencyOptions } from "./concurrency";
import type { Cron } from "./cron";
import type { Defaults } from "./defaults";
import { Job, type JobProps } from "./job";
import type { Permissions } from "./permissions";
import { snakeCaseKeys } from "./private/utils";

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
export type WorkflowDispatchOptions = Record<never, never>;

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
}

/**
 * Represents a GitHub Workflow.
 * This class defines the workflow, its triggers, environment variables,
 * defaults, permissions, concurrency settings, and allows for job creation.
 */
export class Workflow extends Component {
  public readonly triggers: WorkflowTriggers;
  public readonly env?: Record<string, string>;
  public readonly defaults?: Defaults;
  public readonly permissions?: Permissions;
  public readonly concurrency?: ConcurrencyOptions;

  /**
   * Initializes a new instance of the Workflow class.
   * @param scope - The construct scope.
   * @param name - The name of the workflow.
   * @param props - The properties for configuring the workflow.
   */
  constructor(scope: IConstruct, name: string, props: WorkflowProps) {
    super(scope, name);

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
   * Gets the name of the workflow.
   */
  get name(): string {
    return this.node.id;
  }

  /**
   * Adds a new job to the workflow.
   * @param name - The name of the job.
   * @param props - The properties for the job.
   * @returns The created Job instance.
   */
  public addJob(name: string, props: JobProps): Job {
    return new Job(this, name, props);
  }

  /**
   * Converts the workflow configuration to an object representation.
   * @returns The workflow configuration object.
   */
  public _toObject(): Record<string, unknown> {
    const jobs = this.node.findAll().filter((n) => n instanceof Job) as Job[];
    const workflow: Record<string, unknown> = {
      name: this.name,
      on: snakeCaseKeys(JSON.parse(JSON.stringify(this.triggers)), "_"),
      env: this.env,
      defaults: this.defaults,
      permissions: this.permissions,
      ...(this.concurrency && {
        concurrency: {
          group: this.concurrency.group,
          "cancel-in-progress": this.concurrency.cancelInProgress,
        },
      }),
      jobs: jobs.reduce((prev, current) => Object.assign(prev, current._toObject()), {}),
    };
    return workflow;
  }
}

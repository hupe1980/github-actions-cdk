import { Action, type ActionOutputs, type ActionProps } from "../action";
import type { Job } from "../job";
import type { Step } from "../step";

/**
 * Output structure for the Checkout action.
 *
 * Extends from ActionOutputs to include specific outputs related to
 * the checkout process, such as the reference and commit hash.
 */
export interface CheckoutOutputs extends ActionOutputs {
  /**
   * The reference (branch, tag, or SHA) that was checked out.
   */
  readonly ref: string;

  /**
   * The commit hash of the checked-out version.
   */
  readonly commit: string;
}

/**
 * Properties for configuring the Checkout component in a GitHub Actions workflow.
 *
 * This interface defines various options available for the Checkout action,
 * including authentication, repository reference, and checkout behavior.
 */
export interface CheckoutProps extends ActionProps {
  /**
   * Repository name with owner, for example, `actions/checkout`.
   *
   * @default github.repository
   */
  readonly repository?: string;

  /**
   * The branch, tag, or SHA to checkout.
   * Defaults to the reference or SHA for the triggering event,
   * or the default branch otherwise.
   */
  readonly ref?: string;

  /**
   * Personal Access Token (PAT) used to fetch the repository,
   * enabling authenticated git commands.
   *
   * @default github.token
   */
  readonly token?: string;

  /**
   * SSH key used to fetch the repository, enabling authenticated git commands.
   */
  readonly sshKey?: string;

  /**
   * Known hosts to add to the SSH configuration.
   * Public SSH keys for a host can be obtained with `ssh-keyscan`,
   * e.g., `ssh-keyscan github.com`.
   */
  readonly sshKnownHosts?: string;

  /**
   * Whether to perform strict host key checking.
   * When `true`, adds strict SSH configuration options to the command line.
   *
   * @default true
   */
  readonly sshStrict?: boolean;

  /**
   * User for connecting to the SSH host.
   * Defaults to 'git'.
   *
   * @default "git"
   */
  readonly sshUser?: string;

  /**
   * Configures the token or SSH key in the local git configuration.
   *
   * @default true
   */
  readonly persistCredentials?: boolean;

  /**
   * Path under `$GITHUB_WORKSPACE` to place the repository.
   */
  readonly path?: string;

  /**
   * Whether to run `git clean -ffdx && git reset --hard HEAD` before fetching.
   *
   * @default true
   */
  readonly clean?: boolean;

  /**
   * Filter for partially cloning the repository.
   * Overrides `sparseCheckout` if set.
   */
  readonly filter?: string;

  /**
   * Patterns for sparse checkout.
   * Only the specified directories or files will be checked out.
   */
  readonly sparseCheckout?: string[];

  /**
   * Whether to use cone mode when performing a sparse checkout.
   *
   * @default true
   */
  readonly sparseCheckoutConeMode?: boolean;

  /**
   * Number of commits to fetch.
   * `0` indicates all history for all branches and tags.
   *
   * @default 1
   */
  readonly fetchDepth?: number;

  /**
   * Whether to fetch tags even if `fetchDepth > 0`.
   *
   * @default false
   */
  readonly fetchTags?: boolean;

  /**
   * Whether to show progress status output while fetching.
   *
   * @default true
   */
  readonly showProgress?: boolean;

  /**
   * Whether to download Git LFS (Large File Storage) files.
   *
   * @default false
   */
  readonly lfs?: boolean;

  /**
   * Whether to checkout submodules,
   * with options for `true` (checkout submodules) or `recursive` (checkout submodules recursively).
   *
   * @default false
   */
  readonly submodules?: boolean | "recursive";

  /**
   * Adds the repository path to `safe.directory` in the Git global configuration.
   *
   * @default true
   */
  readonly setSafeDirectory?: boolean;

  /**
   * Base URL for the GitHub instance to clone from.
   * Uses environment defaults if not specified.
   */
  readonly githubServerUrl?: string;
}

/**
 * The Checkout action, which checks out a Git repository at a specified version
 * in a GitHub Actions workflow.
 *
 * The Checkout class provides settings for cloning a repository, allowing
 * additional parameters for authentication, configuration, and clone options.
 */
export class Checkout extends Action<CheckoutOutputs> {
  public readonly repository?: string;
  public readonly ref?: string;
  public readonly token?: string;
  public readonly sshKey?: string;
  public readonly sshKnownHosts?: string;
  public readonly sshStrict?: boolean;
  public readonly sshUser?: string;
  public readonly persistCredentials?: boolean;
  public readonly path?: string;
  public readonly clean?: boolean;
  public readonly filter?: string;
  public readonly sparseCheckout?: string[];
  public readonly sparseCheckoutConeMode?: boolean;
  public readonly fetchDepth?: number;
  public readonly fetchTags?: boolean;
  public readonly showProgress?: boolean;
  public readonly lfs?: boolean;
  public readonly submodules?: boolean | "recursive";
  public readonly setSafeDirectory?: boolean;
  public readonly githubServerUrl?: string;

  /**
   * Constructs a Checkout action with the specified ID and properties.
   *
   * @param id - The unique identifier for the action within a workflow.
   * @param props - The properties configuring the checkout action behavior,
   * such as repository, ref, token, and more.
   */
  constructor(id: string, props: CheckoutProps) {
    super(id, props);

    this.repository = props.repository;
    this.ref = props.ref;
    this.token = props.token;
    this.sshKey = props.sshKey;
    this.sshKnownHosts = props.sshKnownHosts;
    this.sshStrict = props.sshStrict;
    this.sshUser = props.sshUser;
    this.persistCredentials = props.persistCredentials;
    this.path = props.path;
    this.clean = props.clean;
    this.filter = props.filter;
    this.sparseCheckout = props.sparseCheckout;
    this.sparseCheckoutConeMode = props.sparseCheckoutConeMode;
    this.fetchDepth = props.fetchDepth;
    this.fetchTags = props.fetchTags;
    this.showProgress = props.showProgress;
    this.lfs = props.lfs;
    this.submodules = props.submodules;
    this.setSafeDirectory = props.setSafeDirectory;
    this.githubServerUrl = props.githubServerUrl;
  }

  /**
   * Binds the checkout action to a job, adding a step to the workflow that
   * checks out the repository based on the defined properties.
   *
   * @param job - The job to bind the checkout step to.
   * @returns A `Step` representing the configured checkout action within the job.
   */
  public bind(job: Job): Step {
    return job.addStep(this.id, {
      name: this.name,
      uses: `actions/checkout@${this.version}`,
      with: {
        repository: this.repository,
        ref: this.ref,
        token: this.token,
        "ssh-key": this.sshKey,
        "ssh-known-hosts": this.sshKnownHosts,
        "ssh-strict": this.sshStrict,
        "ssh-user": this.sshUser,
        "persist-credentials": this.persistCredentials,
        path: this.path,
        clean: this.clean,
        filter: this.filter,
        "sparse-checkout": this.sparseCheckout?.join("\n"),
        "sparse-checkout-cone-mode": this.sparseCheckoutConeMode,
        "fetch-depth": this.fetchDepth,
        "fetch-tags": this.fetchTags,
        "show-progress": this.showProgress,
        lfs: this.lfs,
        submodules: this.submodules,
        "set-safe-directory": this.setSafeDirectory,
        "github-server-url": this.githubServerUrl,
      },
    });
  }

  /**
   * Retrieves the outputs of the Checkout action as specified in the GitHub Actions context.
   *
   * This method returns an object containing output values that can be referenced in subsequent
   * steps of the workflow, such as the checked-out reference and commit.
   *
   * @returns An object containing the output values of the action.
   */
  public get outputs(): CheckoutOutputs {
    return {
      ref: `\${{ steps.${this.id}.outputs.ref }}`,
      commit: `\${{ steps.${this.id}.outputs.commit }}`,
    };
  }
}

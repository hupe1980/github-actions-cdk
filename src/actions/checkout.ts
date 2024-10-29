import { Action, type ActionProps } from "../action";
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Checkout action.
 *
 * Extends from `ActionOutputs` to include specific outputs related to
 * the checkout process, such as the reference and commit hash.
 */
export interface CheckoutV4Outputs {
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
 * This interface defines the various options available for the Checkout action,
 * including authentication, repository reference, and checkout behavior.
 */
export interface CheckoutV4Props extends ActionProps {
  /**
   * Repository name with owner, for example, `owner/repo`.
   *
   * @default github.repository
   */
  readonly repository?: string;

  /**
   * The branch, tag, or SHA to checkout. Defaults to the triggering event's reference
   * or SHA, or the default branch if unspecified.
   */
  readonly ref?: string;

  /**
   * Personal Access Token (PAT) used to fetch the repository,
   * enabling authenticated Git commands.
   *
   * @default github.token
   */
  readonly token?: string;

  /**
   * SSH key used to fetch the repository, enabling authenticated Git commands.
   */
  readonly sshKey?: string;

  /**
   * Known hosts to add to the SSH configuration, as used by SSH.
   * Hosts can be retrieved via `ssh-keyscan`, e.g., `ssh-keyscan github.com`.
   */
  readonly sshKnownHosts?: string;

  /**
   * Determines if strict host key checking should be enforced.
   *
   * @default true
   */
  readonly sshStrict?: boolean;

  /**
   * Username used when connecting to the SSH host.
   *
   * @default "git"
   */
  readonly sshUser?: string;

  /**
   * Determines if credentials should be configured in the local git configuration.
   *
   * @default true
   */
  readonly persistCredentials?: boolean;

  /**
   * Directory under `$GITHUB_WORKSPACE` where the repository is checked out.
   */
  readonly path?: string;

  /**
   * Determines if `git clean` and `git reset` should be run before fetching.
   *
   * @default true
   */
  readonly clean?: boolean;

  /**
   * Specifies a filter for partially cloning the repository.
   * This will override `sparseCheckout` if set.
   */
  readonly filter?: string;

  /**
   * Patterns for sparse checkout.
   * Only the specified directories or files will be checked out.
   */
  readonly sparseCheckout?: string[];

  /**
   * Determines if cone mode should be used during sparse checkout.
   *
   * @default true
   */
  readonly sparseCheckoutConeMode?: boolean;

  /**
   * Number of commits to fetch. `0` indicates all history for all branches and tags.
   *
   * @default 1
   */
  readonly fetchDepth?: number;

  /**
   * Determines if tags should be fetched, even if `fetchDepth` is greater than `0`.
   *
   * @default false
   */
  readonly fetchTags?: boolean;

  /**
   * Determines if fetch progress should be shown in the logs.
   *
   * @default true
   */
  readonly showProgress?: boolean;

  /**
   * Determines if Git LFS (Large File Storage) files should be downloaded.
   *
   * @default false
   */
  readonly lfs?: boolean;

  /**
   * Determines if submodules should be checked out.
   * Options are `true` (checkout submodules) or `"recursive"` (checkout submodules recursively).
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
   * Base URL for the GitHub instance from which to clone.
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
export class CheckoutV4 extends Action {
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
  constructor(id: string, props: CheckoutV4Props) {
    super(id, { version: "v4", ...props });

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
   * @returns A `RegularStep` representing the configured checkout action within the job.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.renderName(),
      uses: this.renderUses("actions/checkout"),
      parameters: {
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
   * @returns An object containing the output values, including the checked-out
   * reference and commit hash, to be used in subsequent steps.
   */
  public get outputs(): CheckoutV4Outputs {
    return {
      ref: `\${{ steps.${this.id}.outputs.ref }}`,
      commit: `\${{ steps.${this.id}.outputs.commit }}`,
    };
  }
}

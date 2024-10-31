import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

/**
 * Output structure for the Checkout action.
 *
 * @remarks
 * This interface defines specific outputs provided by the Checkout action,
 * including the `ref` and `commit` properties, which indicate the reference
 * and commit hash of the checked-out repository, respectively.
 */
export interface CheckoutV4Outputs {
  /**
   * The reference (branch, tag, or SHA) that was checked out.
   *
   * @example "main"
   */
  readonly ref: string;

  /**
   * The commit hash of the checked-out version.
   *
   * @example "e5e8c1a..."
   */
  readonly commit: string;
}

/**
 * Configuration properties for the Checkout action in a GitHub Actions workflow.
 *
 * @remarks
 * `CheckoutV4Props` defines the various options available for the Checkout action,
 * including authentication, repository reference, and checkout behavior.
 */
export interface CheckoutV4Props extends CommonActionProps {
  /**
   * Repository name with owner, in the format `owner/repo`.
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
   * Personal Access Token (PAT) used for authenticated Git commands.
   *
   * @default github.token
   */
  readonly token?: string;

  /**
   * SSH key for authenticated Git commands.
   */
  readonly sshKey?: string;

  /**
   * SSH hosts to add to the configuration, retrieved via `ssh-keyscan`.
   */
  readonly sshKnownHosts?: string;

  /**
   * Enables or disables strict host key checking for SSH.
   *
   * @default true
   */
  readonly sshStrict?: boolean;

  /**
   * Username for SSH host connection.
   *
   * @default "git"
   */
  readonly sshUser?: string;

  /**
   * Determines if credentials should persist in the local git configuration.
   *
   * @default true
   */
  readonly persistCredentials?: boolean;

  /**
   * Directory under `$GITHUB_WORKSPACE` where the repository is checked out.
   */
  readonly path?: string;

  /**
   * Specifies if `git clean` and `git reset` are run before fetching.
   *
   * @default true
   */
  readonly clean?: boolean;

  /**
   * A filter for partially cloning the repository.
   */
  readonly filter?: string;

  /**
   * Patterns for sparse checkout.
   */
  readonly sparseCheckout?: string[];

  /**
   * Enables cone mode during sparse checkout.
   *
   * @default true
   */
  readonly sparseCheckoutConeMode?: boolean;

  /**
   * Number of commits to fetch (`0` for full history).
   *
   * @default 1
   */
  readonly fetchDepth?: number;

  /**
   * Fetches tags if `fetchDepth` is greater than `0`.
   *
   * @default false
   */
  readonly fetchTags?: boolean;

  /**
   * Displays fetch progress in logs.
   *
   * @default true
   */
  readonly showProgress?: boolean;

  /**
   * Downloads Git LFS files.
   *
   * @default false
   */
  readonly lfs?: boolean;

  /**
   * Determines if submodules should be checked out.
   *
   * @default false
   */
  readonly submodules?: boolean | "recursive";

  /**
   * Adds the repository path to `safe.directory` in Git global config.
   *
   * @default true
   */
  readonly setSafeDirectory?: boolean;

  /**
   * Base URL for cloning from GitHub instance.
   */
  readonly githubServerUrl?: string;

  /**
   * Specifies the version of the action to use.
   */
  readonly version?: string;
}

/**
 * Checkout action for GitHub Actions workflows, configuring a Git repository checkout.
 *
 * @remarks
 * This class allows configuration of the Checkout action, supporting
 * additional parameters for authentication, repository reference, and
 * clone behavior.
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
   * Initializes a new instance of the Checkout action.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for checkout action behavior.
   */
  constructor(scope: IConstruct, id: string, props: CheckoutV4Props = {}) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: "actions/checkout",
      version: "v4",
      parameters: {
        repository: props.repository,
        ref: props.ref,
        token: props.token,
        "ssh-key": props.sshKey,
        "ssh-known-hosts": props.sshKnownHosts,
        "ssh-strict": props.sshStrict,
        "ssh-user": props.sshUser,
        "persist-credentials": props.persistCredentials,
        path: props.path,
        clean: props.clean,
        filter: props.filter,
        "sparse-checkout": props.sparseCheckout?.join("\n"),
        "sparse-checkout-cone-mode": props.sparseCheckoutConeMode,
        "fetch-depth": props.fetchDepth,
        "fetch-tags": props.fetchTags,
        "show-progress": props.showProgress,
        lfs: props.lfs,
        submodules: props.submodules,
        "set-safe-directory": props.setSafeDirectory,
        "github-server-url": props.githubServerUrl,
      },
    });

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
   * Retrieves outputs of the Checkout action.
   *
   * @returns `CheckoutV4Outputs` containing `ref` and `commit` for further use.
   */
  public get outputs(): CheckoutV4Outputs {
    return {
      ref: `\${{ steps.${this.id}.outputs.ref }}`,
      commit: `\${{ steps.${this.id}.outputs.commit }}`,
    };
  }
}

import { Action, type ActionProps } from "../action"; // Adjust path as needed
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Setup Node.js action.
 *
 * Contains specific outputs related to the Node.js setup process, including
 * the installed Node.js version and cache hit status.
 */
export interface SetupNodeV4Outputs {
  /**
   * A boolean value represented as a string indicating if a cache was hit.
   */
  readonly cacheHit: string;

  /**
   * The version of Node.js that was installed by the action.
   */
  readonly nodeVersion: string;
}

/**
 * Properties for configuring the Setup Node.js action within a GitHub Actions workflow.
 *
 * This interface extends ActionProps to include specific inputs for the Setup Node.js
 * action, enabling custom configurations for Node.js version, caching, and authentication.
 */
export interface SetupNodeV4Props extends ActionProps {
  /**
   * Enables `always-auth` in the npmrc configuration to always require authentication.
   *
   * @default false
   */
  readonly alwaysAuth?: boolean;

  /**
   * Version specification of Node.js to use, following SemVer notation.
   * Supports various aliases, such as `lts/*` for long-term support versions,
   * as well as specific builds.
   *
   * @example "12.x", "10.15.1", ">=10.15.0", "lts/Hydrogen", "16-nightly", "latest", "node"
   */
  readonly nodeVersion: string;

  /**
   * Optional file containing the Node.js version specification, typically used by version managers.
   *
   * @example "package.json", ".nvmrc", ".node-version", ".tool-versions"
   */
  readonly nodeVersionFile?: string;

  /**
   * Target system architecture for the Node.js installation.
   *
   * @example "x86" | "x64" - Defaults to the system architecture if not specified.
   */
  readonly architecture?: string;

  /**
   * When set to `true`, checks for the latest available Node.js version that matches the specified version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Optional URL of the registry for configuring authentication. This URL is used to set up a project-level
   * `.npmrc` and `.yarnrc` file, allowing authentication through the `NODE_AUTH_TOKEN` environment variable.
   */
  readonly registryUrl?: string;

  /**
   * Optional scope for authentication against scoped registries. If unspecified,
   * defaults to the repository owner when using GitHub Packages.
   */
  readonly scope?: string;

  /**
   * Token used to fetch Node.js distributions. Defaults to `github.token` on GitHub.com.
   * For GitHub Enterprise Server (GHES), a personal access token may be used to avoid rate limiting.
   *
   * @default github.server_url === "https://github.com" ? github.token : ""
   */
  readonly token?: string;

  /**
   * Specifies the package manager to use for caching dependencies in the default directory.
   * Supported values include `"npm"`, `"yarn"`, and `"pnpm"`.
   */
  readonly cache?: "npm" | "yarn" | "pnpm";

  /**
   * Path to the dependency file used for caching. Supports individual file paths and wildcards to match multiple files.
   *
   * @example "package-lock.json", "yarn.lock"
   */
  readonly cacheDependencyPath?: string;
}

/**
 * Class representing the Setup Node.js action, allowing configuration of the Node.js version,
 * registry settings, caching, and more within a GitHub Actions workflow.
 */
export class SetupNodeV4 extends Action {
  public readonly alwaysAuth?: boolean;
  public readonly nodeVersion: string;
  public readonly nodeVersionFile?: string;
  public readonly architecture?: string;
  public readonly checkLatest?: boolean;
  public readonly registryUrl?: string;
  public readonly scope?: string;
  public readonly token?: string;
  public readonly cache?: "npm" | "yarn" | "pnpm";
  public readonly cacheDependencyPath?: string;

  /**
   * Initializes a new instance of the `SetupNode` action with the specified properties.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the Setup Node.js action, including version,
   * authentication, and caching settings.
   */
  constructor(id: string, props: SetupNodeV4Props) {
    super(id, { version: "v4", ...props });

    this.alwaysAuth = props.alwaysAuth;
    this.nodeVersion = props.nodeVersion;
    this.nodeVersionFile = props.nodeVersionFile;
    this.architecture = props.architecture;
    this.checkLatest = props.checkLatest;
    this.registryUrl = props.registryUrl;
    this.scope = props.scope;
    this.token = props.token;
    this.cache = props.cache;
    this.cacheDependencyPath = props.cacheDependencyPath;
  }

  /**
   * Binds the action to a job by adding it as a step in the GitHub Actions workflow.
   *
   * This method configures the action's parameters and integrates it into the specified job,
   * making it a part of the workflow execution.
   *
   * @param job - The job to which the action will be bound.
   * @returns The configured `RegularStep` for the GitHub Actions job, allowing the action to run within the workflow.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.renderName(),
      uses: this.renderUses("actions/setup-node"),
      parameters: {
        "always-auth": this.alwaysAuth,
        "node-version": this.nodeVersion,
        "node-version-file": this.nodeVersionFile,
        architecture: this.architecture,
        "check-latest": this.checkLatest,
        "registry-url": this.registryUrl,
        scope: this.scope,
        token: this.token,
        cache: this.cache,
        "cache-dependency-path": this.cacheDependencyPath,
      },
    });
  }

  /**
   * Retrieves the outputs of the Setup Node.js action as specified in the GitHub Actions context.
   *
   * This method returns an object containing output values that can be referenced in subsequent
   * steps of the workflow, such as the installed Node.js version and cache hit status.
   *
   * @returns An object containing the output values of the action, including the cache hit status and the Node.js version.
   */
  public get outputs(): SetupNodeV4Outputs {
    return {
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
      nodeVersion: `\${{ steps.${this.id}.outputs.node-version }}`,
    };
  }
}

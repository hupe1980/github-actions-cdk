import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";
import { RegularStep } from "../step";

/**
 * Outputs from the Setup Node.js action.
 *
 * This interface includes key output values such as the Node.js version installed and whether a cache was used.
 */
export interface SetupNodeV4Outputs {
  /**
   * Indicates if a cache was successfully hit during the action.
   */
  readonly cacheHit: string;

  /**
   * The version of Node.js that was installed.
   */
  readonly nodeVersion: string;
}

/**
 * Properties for configuring the Setup Node.js action within a GitHub Actions workflow.
 *
 * This interface extends common action properties to include options specific to Node.js setup,
 * such as versioning, caching, and registry authentication.
 */
export interface SetupNodeV4Props extends CommonActionProps {
  /**
   * If true, forces authentication to the npm registry even when installing public packages.
   */
  readonly alwaysAuth?: boolean;

  /**
   * The version of Node.js to use, specified as a version range or exact version.
   */
  readonly nodeVersion: string;

  /**
   * Optional path to a file containing the Node.js version to use.
   * This is useful for dynamically specifying versions.
   */
  readonly nodeVersionFile?: string;

  /**
   * The target architecture for the Node.js installation (e.g., `x64` or `arm64`).
   */
  readonly architecture?: string;

  /**
   * If true, checks for the latest version matching the specified version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * The URL of the npm registry to authenticate against.
   */
  readonly registryUrl?: string;

  /**
   * Scope for the npm packages, useful for scoped packages in the registry.
   */
  readonly npmPackageScope?: string;

  /**
   * Token for authentication with the npm registry.
   */
  readonly token?: string;

  /**
   * The package manager to use for caching (`npm`, `yarn`, or `pnpm`).
   */
  readonly cache?: "npm" | "yarn" | "pnpm";

  /**
   * Optional path to dependency files for caching.
   * This allows caching of multiple dependencies efficiently.
   */
  readonly cacheDependencyPath?: string;
}

/**
 * Class representing the Setup Node.js action in a GitHub Actions workflow.
 *
 * This action configures Node.js version, caching, registry settings, and more to facilitate builds.
 */
export class SetupNodeV4 extends Action {
  public readonly alwaysAuth?: boolean;
  public readonly nodeVersion: string;
  public readonly nodeVersionFile?: string;
  public readonly architecture?: string;
  public readonly checkLatest: boolean;
  public readonly registryUrl?: string;
  public readonly npmPackageScope?: string;
  public readonly token?: string;
  public readonly cache?: "npm" | "yarn" | "pnpm";
  public readonly cacheDependencyPath?: string;

  /**
   * Initializes a new instance of the Setup Node.js action.
   *
   * @param scope - Scope in which this construct is defined.
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring Node.js setup, including version and cache settings.
   */
  constructor(scope: IConstruct, id: string, props: SetupNodeV4Props) {
    super(scope, id, {
      actionIdentifier: "actions/setup-node",
      version: "v4",
      ...props,
    });

    this.alwaysAuth = props.alwaysAuth;
    this.nodeVersion = props.nodeVersion;
    this.nodeVersionFile = props.nodeVersionFile;
    this.architecture = props.architecture;
    this.checkLatest = props.checkLatest ?? false;
    this.registryUrl = props.registryUrl;
    this.npmPackageScope = props.npmPackageScope;
    this.token = props.token;
    this.cache = props.cache;
    this.cacheDependencyPath = props.cacheDependencyPath;
  }

  /**
   * Creates a regular step for the Setup Node.js action.
   *
   * This method sets up the parameters for the action and prepares it to be
   * executed in the workflow.
   *
   * @returns The configured RegularStep for the GitHub Actions job.
   */
  protected createRegularStep(): RegularStep {
    return new RegularStep(this, this.id, {
      name: this.name,
      uses: this.uses,
      parameters: {
        "always-auth": this.alwaysAuth,
        "node-version": this.nodeVersion,
        "node-version-file": this.nodeVersionFile,
        architecture: this.architecture,
        "check-latest": this.checkLatest,
        "registry-url": this.registryUrl,
        scope: this.npmPackageScope,
        token: this.token,
        cache: this.cache,
        "cache-dependency-path": this.cacheDependencyPath,
      },
    });
  }

  /**
   * Retrieves outputs from the Setup Node.js action for use in subsequent workflow steps.
   *
   * @returns The Setup Node.js action's outputs, including `cacheHit` and `nodeVersion`.
   */
  public get outputs(): SetupNodeV4Outputs {
    return {
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
      nodeVersion: `\${{ steps.${this.id}.outputs.node-version }}`,
    };
  }
}

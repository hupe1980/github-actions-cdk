import { Action, type ActionProps } from "../action"; // Adjust path as needed
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Setup Go action.
 *
 * Includes outputs specifically related to the Go setup process, such as
 * the installed Go version and cache hit status.
 */
export interface SetupGoV5Outputs {
  /**
   * The version of Go installed by this action.
   */
  readonly goVersion: string;

  /**
   * A boolean indicating whether a cache was hit for Go dependencies.
   */
  readonly cacheHit: string;
}

/**
 * Properties for configuring the Setup Go action within a GitHub Actions workflow.
 *
 * This interface extends ActionProps to include specific options for the Setup Go
 * action, enabling custom configuration of Go version, caching, and more.
 */
export interface SetupGoV5Props extends ActionProps {
  /**
   * Specifies the Go version to download and set up.
   * Accepts exact version strings, semver specs, or ranges.
   */
  readonly goVersion: string;

  /**
   * Path to a go.mod or go.work file to be used for automatic Go version detection.
   * If set, the specified version file is used to resolve the Go version.
   */
  readonly goVersionFile?: string;

  /**
   * Set to true to force the action to check for the latest Go version available.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Token used to access Go distributions from go-versions. Defaults to the
   * GitHub-provided token in most workflows.
   */
  readonly token?: string;

  /**
   * Enables caching of Go modules dependencies. This is recommended to reduce
   * workflow execution time by reusing previously downloaded dependencies.
   *
   * @default true
   */
  readonly cache?: boolean;

  /**
   * Path to the dependency file (e.g., go.sum) to use for caching.
   * If provided, the action uses this path to manage cache for Go modules.
   */
  readonly cacheDependencyPath?: string;

  /**
   * The target CPU architecture for the Go installation. Supported values
   * include `x86`, `x64`, `arm`, etc. Defaults to the architecture of the
   * system executing the action.
   */
  readonly architecture?: string;
}

/**
 * Class representing the Setup Go action, which configures the Go environment
 * within a GitHub Actions workflow. Supports specific Go version setup, caching,
 * and architecture targeting.
 */
export class SetupGoV5 extends Action {
  public readonly goVersion: string;
  public readonly goVersionFile?: string;
  public readonly checkLatest?: boolean;
  public readonly token?: string;
  public readonly cache?: boolean;
  public readonly cacheDependencyPath?: string;
  public readonly architecture?: string;

  /**
   * Initializes a new instance of the `SetupGo` action with the specified properties.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties used to configure the Setup Go action, including
   * Go version, cache settings, architecture, and optional token for distributions.
   */
  constructor(id: string, props: SetupGoV5Props) {
    super(id, { version: "v5", ...props });

    this.goVersion = props.goVersion;
    this.goVersionFile = props.goVersionFile;
    this.checkLatest = props.checkLatest ?? false;
    this.token = props.token;
    this.cache = props.cache ?? true;
    this.cacheDependencyPath = props.cacheDependencyPath;
    this.architecture = props.architecture;
  }

  /**
   * Binds the action to a job by adding it as a step in the GitHub Actions workflow.
   *
   * This method integrates the configured Setup Go action into the specified job, setting up the Go environment
   * and applying the provided parameters.
   *
   * @param job - The job to bind the action to.
   * @returns The configured `RegularStep` for the GitHub Actions job, with parameters set as specified in the action properties.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.renderName(),
      uses: this.renderUses("actions/setup-go"),
      parameters: {
        "go-version": this.goVersion,
        "go-version-file": this.goVersionFile,
        "check-latest": this.checkLatest,
        token: this.token,
        cache: this.cache,
        "cache-dependency-path": this.cacheDependencyPath,
        architecture: this.architecture,
      },
    });
  }

  /**
   * Retrieves the outputs of the Setup Go action, making the installed Go version
   * and cache status available for reference in subsequent workflow steps.
   *
   * @returns An object containing the output values of the action, including `goVersion` and `cacheHit`.
   */
  public get outputs(): SetupGoV5Outputs {
    return {
      goVersion: `\${{ steps.${this.id}.outputs.go-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
    };
  }
}

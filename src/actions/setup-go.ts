import { Action, type ActionProps } from "../action";
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Setup Go action.
 *
 * Extends from ActionOutputs to include specific outputs related to
 * the Go setup process.
 */
export interface SetupGoOutputs {
  /**
   * The installed Go version.
   */
  readonly goVersion: string;

  /**
   * A boolean value indicating if a cache was hit.
   */
  readonly cacheHit: string;
}

/**
 * Properties for configuring the Setup Go action in a GitHub Actions workflow.
 *
 * This interface extends ActionProps to include specific inputs for the
 * Setup Go action, such as version specifications and caching settings.
 */
export interface SetupGoProps extends ActionProps {
  /**
   * The Go version to download (if necessary) and use. Supports semver spec and ranges.
   */
  readonly goVersion: string;

  /**
   * Path to the go.mod or go.work file.
   */
  readonly goVersionFile?: string;

  /**
   * Set this option to true if you want the action to always check for the latest available version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Used to pull Go distributions from go-versions. Defaults to a GitHub token.
   */
  readonly token?: string;

  /**
   * Used to specify whether caching is needed.
   *
   * @default true
   */
  readonly cache?: boolean;

  /**
   * Used to specify the path to a dependency file (go.sum).
   */
  readonly cacheDependencyPath?: string;

  /**
   * Target architecture for Go to use.
   * Examples: x86, x64. Will use system architecture by default.
   */
  readonly architecture?: string;
}

/**
 * Class representing a Go setup action, allowing configuration of the Go version,
 * caching, and more within a GitHub Actions workflow.
 */
export class SetupGo extends Action {
  public readonly goVersion: string;
  public readonly goVersionFile?: string;
  public readonly checkLatest?: boolean;
  public readonly token?: string;
  public readonly cache?: boolean;
  public readonly cacheDependencyPath?: string;
  public readonly architecture?: string;

  /**
   * Initializes a new instance of the `SetupGo` action.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the Setup Go action.
   */
  constructor(id: string, props: SetupGoProps) {
    super(id, props);

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
   * This method configures the action's parameters and integrates it into the specified job,
   * making it a part of the workflow execution.
   *
   * @param job - The job to bind the action to.
   * @returns The configured `RegularStep` for the GitHub Actions job.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.name,
      uses: `actions/setup-go@${this.version}`,
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
   * Retrieves the outputs of the SetupGo action as specified in the GitHub Actions context.
   *
   * This method returns an object containing output values that can be referenced in subsequent
   * steps of the workflow, such as the installed Go version and cache hit status.
   *
   * @returns An object containing the output values of the action.
   */
  public get outputs(): SetupGoOutputs {
    return {
      goVersion: `\${{ steps.${this.id}.outputs.go-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
    };
  }
}

import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";
import { RegularStep } from "../step";

/**
 * Output structure for the Setup Go action.
 *
 * Provides outputs related to the Go setup process, such as
 * the installed Go version and cache hit status.
 */
export interface SetupGoV5Outputs {
  /**
   * The version of Go that has been installed.
   */
  readonly goVersion: string;

  /**
   * A boolean value indicating whether a cache entry was found during the setup.
   */
  readonly cacheHit: string;
}

/**
 * Properties for configuring the Setup Go action.
 *
 * This interface defines the specific options for Go setup, including
 * version, caching, and target architecture.
 */
export interface SetupGoV5Props extends CommonActionProps {
  /**
   * The version range or exact version of Go to use.
   * If not specified, the action will read the version from the `go-version` file if it exists.
   */
  readonly goVersion: string;

  /**
   * Optional file containing the Go version to use.
   * Typically this would be `go-version`.
   */
  readonly goVersionFile?: string;

  /**
   * If true, the action will check for the latest available version that satisfies the specified version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Token used for authentication when fetching Go distributions from the repository.
   */
  readonly token?: string;

  /**
   * A boolean indicating whether to cache Go dependencies.
   *
   * @default true
   */
  readonly cache?: boolean;

  /**
   * Path to dependency files for caching. Supports wildcards or a list of file names.
   * This allows caching of multiple dependencies efficiently.
   */
  readonly cacheDependencyPath?: string;

  /**
   * Target architecture of the Go interpreter.
   * Supported values include "amd64", "arm64", etc.
   */
  readonly architecture?: string;
}

/**
 * Class representing the Setup Go action in a GitHub Actions workflow.
 *
 * This action supports Go version setup, dependency caching, and architecture targeting.
 */
export class SetupGoV5 extends Action {
  public readonly goVersion: string;
  public readonly goVersionFile?: string;
  public readonly checkLatest: boolean;
  public readonly token?: string;
  public readonly cache: boolean;
  public readonly cacheDependencyPath?: string;
  public readonly architecture?: string;

  /**
   * Initializes a new instance of the `SetupGo` action with the specified properties.
   *
   * @param scope - Scope in which this construct is defined.
   * @param id - Unique identifier for the action within a workflow.
   * @param props - Configuration properties for Go setup.
   */
  constructor(scope: IConstruct, id: string, props: SetupGoV5Props) {
    super(scope, id, {
      actionIdentifier: "actions/setup-go",
      version: "v5",
      ...props,
    });

    this.goVersion = props.goVersion;
    this.goVersionFile = props.goVersionFile;
    this.checkLatest = props.checkLatest ?? false;
    this.token = props.token;
    this.cache = props.cache ?? true;
    this.cacheDependencyPath = props.cacheDependencyPath;
    this.architecture = props.architecture;
  }

  /**
   * Creates a regular step for the Setup Go action.
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
   * Retrieves outputs from the Setup Go action.
   *
   * This method returns an object containing output values that can be referenced in subsequent
   * steps of the workflow, including the installed Go version and cache status.
   *
   * @returns Go setup outputs, including the installed Go version and cache status.
   */
  public get outputs(): SetupGoV5Outputs {
    return {
      goVersion: `\${{ steps.${this.id}.outputs.go-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
    };
  }
}

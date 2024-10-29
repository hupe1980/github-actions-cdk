import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action"; // Adjust path as needed
import { RegularStep } from "../step";

/**
 * Outputs from the Setup Python action.
 *
 * This interface provides access to the installed Python version, cache hit status,
 * and the path to the Python executable, which can be referenced in subsequent workflow steps.
 */
export interface SetupPythonV5Outputs {
  /**
   * The version of Python that was installed.
   */
  readonly pythonVersion: string;

  /**
   * Indicates if a cache was successfully hit during the action.
   */
  readonly cacheHit: string;

  /**
   * The file path to the Python executable.
   */
  readonly pythonPath: string;
}

/**
 * Configuration options for the Setup Python action within a GitHub Actions workflow.
 *
 * This interface extends common action properties to include options specific to Python setup,
 * such as version specifications, caching, and environment updates.
 */
export interface SetupPythonV5Props extends CommonActionProps {
  /**
   * The version of Python to install, specified as a version range or exact version.
   */
  readonly pythonVersion: string;

  /**
   * Optional path to a file containing the Python version to use.
   * This is useful for dynamically specifying versions.
   */
  readonly pythonVersionFile?: string;

  /**
   * The package manager to use for caching dependencies (`pip`, `pipenv`, or `poetry`).
   */
  readonly cache?: "pip" | "pipenv" | "poetry";

  /**
   * The target architecture for the Python installation (e.g., `x64` or `arm64`).
   */
  readonly architecture?: string;

  /**
   * If true, checks for the latest version matching the specified version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Token for authentication with package registries.
   */
  readonly token?: string;

  /**
   * Optional path to dependency files for caching.
   */
  readonly cacheDependencyPath?: string;

  /**
   * If true, updates the environment with the installed Python version.
   *
   * @default true
   */
  readonly updateEnvironment?: boolean;

  /**
   * If true, allows pre-release versions of Python to be installed.
   *
   * @default false
   */
  readonly allowPrereleases?: boolean;
}

/**
 * Action class to configure Python within a GitHub Actions workflow.
 *
 * This action supports version specification, dependency caching, environment updates, and more.
 */
export class SetupPythonV5 extends Action {
  public readonly pythonVersion: string;
  public readonly pythonVersionFile?: string;
  public readonly cache?: "pip" | "pipenv" | "poetry";
  public readonly architecture?: string;
  public readonly checkLatest: boolean;
  public readonly token?: string;
  public readonly cacheDependencyPath?: string;
  public readonly updateEnvironment: boolean;
  public readonly allowPrereleases: boolean;

  /**
   * Initializes the SetupPython action instance.
   *
   * @param scope - Scope in which this construct is defined.
   * @param id - Unique identifier for the action instance.
   * @param props - Configuration options, including Python version, cache settings, and environment variables.
   */
  constructor(scope: IConstruct, id: string, props: SetupPythonV5Props) {
    super(scope, id, {
      actionIdentifier: "actions/setup-python",
      version: "v5",
      ...props,
    });

    this.pythonVersion = props.pythonVersion;
    this.pythonVersionFile = props.pythonVersionFile;
    this.cache = props.cache;
    this.architecture = props.architecture;
    this.checkLatest = props.checkLatest ?? false;
    this.token = props.token;
    this.cacheDependencyPath = props.cacheDependencyPath;
    this.updateEnvironment = props.updateEnvironment ?? true;
    this.allowPrereleases = props.allowPrereleases ?? false;
  }

  /**
   * Creates a regular step in the specified job for the Setup Python action.
   *
   * @returns A configured `RegularStep` instance for executing the Setup Python action.
   */
  protected createRegularStep(): RegularStep {
    return new RegularStep(this, this.id, {
      name: this.name,
      uses: this.uses,
      parameters: {
        "python-version": this.pythonVersion,
        "python-version-file": this.pythonVersionFile,
        cache: this.cache,
        architecture: this.architecture,
        "check-latest": this.checkLatest,
        token: this.token,
        "cache-dependency-path": this.cacheDependencyPath,
        "update-environment": this.updateEnvironment,
        "allow-prereleases": this.allowPrereleases,
      },
    });
  }

  /**
   * Retrieves the output parameters from the Setup Python action for use in subsequent workflow steps.
   *
   * @returns Outputs object containing `pythonVersion`, `cacheHit`, and `pythonPath`.
   */
  public get outputs(): SetupPythonV5Outputs {
    return {
      pythonVersion: `\${{ steps.${this.id}.outputs.python-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
      pythonPath: `\${{ steps.${this.id}.outputs.python-path }}`,
    };
  }
}

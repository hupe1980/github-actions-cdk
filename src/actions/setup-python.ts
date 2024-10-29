import { Action, type ActionProps } from "../action"; // Adjust path as needed
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Setup Python action.
 *
 * Contains specific outputs related to the Python setup process,
 * including the installed Python version, cache hit status, and executable path.
 */
export interface SetupPythonV5Outputs {
  /**
   * The installed version of Python or PyPy.
   */
  readonly pythonVersion: string;

  /**
   * A boolean value indicating whether a cache entry was found.
   */
  readonly cacheHit: string;

  /**
   * The absolute path to the Python or PyPy executable.
   */
  readonly pythonPath: string;
}

/**
 * Properties for configuring the Setup Python action within a GitHub Actions workflow.
 *
 * This interface extends ActionProps to include specific inputs for the
 * Setup Python action, allowing customization of version specifications, caching, and more.
 */
export interface SetupPythonV5Props extends ActionProps {
  /**
   * The version range or exact version of Python or PyPy to use, using SemVer's version range syntax.
   * If not specified, the action will read the version from `.python-version` file if it exists.
   */
  readonly pythonVersion: string;

  /**
   * Optional file containing the Python version to use.
   * Typically this would be `.python-version`.
   */
  readonly pythonVersionFile?: string;

  /**
   * Specifies the package manager to use for caching dependencies.
   * Supported values are: "pip", "pipenv", "poetry".
   */
  readonly cache?: "pip" | "pipenv" | "poetry";

  /**
   * Target architecture of the Python or PyPy interpreter.
   * Supported values include "x86", "x64", "arm64".
   */
  readonly architecture?: string;

  /**
   * If true, the action will check for the latest available version that satisfies the specified version.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * Token used for authentication when fetching Python distributions from the GitHub repository.
   */
  readonly token?: string;

  /**
   * Path to dependency files for caching. Supports wildcards or a list of file names.
   * This allows caching of multiple dependencies efficiently.
   */
  readonly cacheDependencyPath?: string;

  /**
   * If true, the action will update environment variables to reflect the new Python version.
   *
   * @default true
   */
  readonly updateEnvironment?: boolean;

  /**
   * When set to true, a version range passed to the 'python-version' input will match prerelease versions
   * if no stable versions are found. Only 'x.y' version ranges are supported for CPython.
   *
   * @default false
   */
  readonly allowPrereleases?: boolean;
}

/**
 * Class representing a Python setup action, enabling configuration of the Python version,
 * caching options, and more within a GitHub Actions workflow.
 */
export class SetupV5Python extends Action {
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
   * Initializes a new instance of the `SetupPython` action.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the Setup Python action, such as version,
   * authentication, caching, and environment updates.
   */
  constructor(id: string, props: SetupPythonV5Props) {
    super(id, { version: "v5", ...props });

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
   * Binds the action to a job by adding it as a step in the GitHub Actions workflow.
   *
   * This method configures the action's parameters and integrates it into the specified job,
   * making it part of the workflow execution.
   *
   * @param job - The job to bind the action to.
   * @returns The configured `RegularStep` for the GitHub Actions job.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.renderName(),
      uses: this.renderUses("actions/setup-python"),
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
   * Retrieves the outputs of the SetupPython action as specified in the GitHub Actions context.
   *
   * This method returns an object containing output values that can be referenced in subsequent
   * steps of the workflow, such as the installed Python version, cache hit status, and executable path.
   *
   * @returns An object containing the output values of the action.
   */
  public get outputs(): SetupPythonV5Outputs {
    return {
      pythonVersion: `\${{ steps.${this.id}.outputs.python-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
      pythonPath: `\${{ steps.${this.id}.outputs.python-path }}`,
    };
  }
}

import { Action, type ActionProps } from "../action";
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * Output structure for the Setup Python action.
 *
 * Extends from ActionOutputs to include specific outputs related to
 * the Python setup process.
 */
export interface SetupPythonOutputs {
  /**
   * The installed Python or PyPy version.
   */
  readonly pythonVersion: string;

  /**
   * A boolean value indicating if a cache entry was found.
   */
  readonly cacheHit: string;

  /**
   * The absolute path to the Python or PyPy executable.
   */
  readonly pythonPath: string;
}

/**
 * Properties for configuring the Setup Python action in a GitHub Actions workflow.
 *
 * This interface extends ActionProps to include specific inputs for the
 * Setup Python action, such as version specifications and caching settings.
 */
export interface SetupPythonProps extends ActionProps {
  /**
   * Version range or exact version of Python or PyPy to use, using SemVer's version range syntax.
   * Reads from .python-version if unset.
   */
  readonly pythonVersion: string;

  /**
   * File containing the Python version to use.
   * Example: .python-version
   */
  readonly pythonVersionFile?: string;

  /**
   * Used to specify a package manager for caching in the default directory.
   * Supported values: pip, pipenv, poetry.
   */
  readonly cache?: "pip" | "pipenv" | "poetry";

  /**
   * The target architecture (x86, x64, arm64) of the Python or PyPy interpreter.
   */
  readonly architecture?: string;

  /**
   * Set this option if you want the action to check for the latest available version that satisfies the version spec.
   *
   * @default false
   */
  readonly checkLatest?: boolean;

  /**
   * The token used to authenticate when fetching Python distributions from the GitHub repository.
   */
  readonly token?: string;

  /**
   * Used to specify the path to dependency files for caching.
   * Supports wildcards or a list of file names for caching multiple dependencies.
   */
  readonly cacheDependencyPath?: string;

  /**
   * Set this option if you want the action to update environment variables.
   *
   * @default true
   */
  readonly updateEnvironment?: boolean;

  /**
   * When true, a version range passed to 'python-version' input will match prerelease versions if no GA versions are found.
   * Only 'x.y' version range is supported for CPython.
   *
   * @default false
   */
  readonly allowPrereleases?: boolean;
}

/**
 * Class representing a Python setup action, allowing configuration of the Python version,
 * caching, and more within a GitHub Actions workflow.
 */
export class SetupPython extends Action {
  public readonly pythonVersion: string;
  public readonly pythonVersionFile?: string;
  public readonly cache?: "pip" | "pipenv" | "poetry";
  public readonly architecture?: string;
  public readonly checkLatest?: boolean;
  public readonly token?: string;
  public readonly cacheDependencyPath?: string;
  public readonly updateEnvironment?: boolean;
  public readonly allowPrereleases?: boolean;

  /**
   * Initializes a new instance of the `SetupPython` action.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the Setup Python action.
   */
  constructor(id: string, props: SetupPythonProps) {
    super(id, props);

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
   * making it a part of the workflow execution.
   *
   * @param job - The job to bind the action to.
   * @returns The configured `RegularStep` for the GitHub Actions job.
   */
  public bind(job: Job): RegularStep {
    return job.addRegularStep(this.id, {
      name: this.name,
      uses: `actions/setup-python@${this.version}`,
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
   * steps of the workflow, such as the installed Python version and cache hit status.
   *
   * @returns An object containing the output values of the action.
   */
  public get outputs(): SetupPythonOutputs {
    return {
      pythonVersion: `\${{ steps.${this.id}.outputs.python-version }}`,
      cacheHit: `\${{ steps.${this.id}.outputs.cache-hit }}`,
      pythonPath: `\${{ steps.${this.id}.outputs.python-path }}`,
    };
  }
}

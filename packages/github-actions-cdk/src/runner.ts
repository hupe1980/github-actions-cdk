/**
 * Represents a GitHub Actions runner environment for executing jobs.
 *
 * @remarks
 * This class provides both GitHub-hosted runner options (`ubuntu-latest`, `windows-latest`, `macos-latest`)
 * and options for configuring self-hosted runners with custom labels. If using self-hosted runners, it is recommended
 * that the `self-hosted` label be included as the first label, which will ensure proper targeting of self-hosted runners.
 *
 * Supported `runs-on` configurations:
 * - Single string for GitHub-hosted runners (e.g., `'ubuntu-latest'`).
 * - Array of strings beginning with `'self-hosted'` for targeting custom self-hosted runners (e.g., `['self-hosted', 'linux', 'x64']`).
 * - Custom labels without `'self-hosted'` for compatibility with Actions Runner Controller, which does not support the `self-hosted` label.
 */
export class Runner {
  /**
   * GitHub-hosted runner for `ubuntu-latest`.
   */
  public static readonly UBUNTU_LATEST = new Runner("ubuntu-latest");

  /**
   * GitHub-hosted runner for `windows-latest`.
   */
  public static readonly WINDOWS_LATEST = new Runner("windows-latest");

  /**
   * GitHub-hosted runner for `macos-latest`.
   */
  public static readonly MACOS_LATEST = new Runner("macos-latest");

  /**
   * Configures a self-hosted runner with specified labels.
   *
   * @param labels - Array of labels for targeting self-hosted runners.
   *   - If the first label is not `self-hosted`, it will be prepended automatically to ensure compatibility with GitHub Actions.
   * @returns A `Runner` instance configured for a self-hosted environment.
   *
   * @example
   * - `Runner.selfHosted(['linux', 'x64'])` - Targets a self-hosted runner with the `self-hosted`, `linux`, and `x64` labels.
   */
  public static selfHosted(labels: string[]): Runner {
    // Ensure 'self-hosted' is the first label if not already included
    const runnerLabels = labels[0] === "self-hosted" ? labels : ["self-hosted", ...labels];
    return new Runner(runnerLabels);
  }

  /**
   * Returns the `runs-on` configuration for this runner.
   *
   * - Returns a single string for GitHub-hosted runners.
   * - Returns an array for self-hosted runner configurations with multiple labels.
   *
   * @returns The `runs-on` configuration for the GitHub Actions job.
   *
   * @example
   * - `'ubuntu-latest'`
   * - `['self-hosted', 'linux', 'x64']`
   */
  public get runsOn(): string | string[] {
    return Array.isArray(this.labels) && this.labels.length === 1 ? this.labels[0] : this.labels;
  }

  /**
   * Initializes a new `Runner` with the specified labels.
   *
   * @param labels - Either a single label string or an array of labels for the runner.
   *
   * @private
   */
  private constructor(private readonly labels: string | string[]) {}
}

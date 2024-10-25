/**
 * Configuration options for the execution environment of a job's steps.
 *
 * `RunSettings` provides control over the shell, working directory, and other
 * environment-specific options used when running commands in a job step.
 */
export interface RunSettings {
	/**
	 * Specifies the shell to use for executing the step's commands.
	 *
	 * This property allows you to define the command-line shell used for the step.
	 * Common options include `bash`, `sh`, `cmd`, `powershell`, or `python`, depending
	 * on the operating system and specific requirements of the step.
	 *
	 * @example
	 * shell: "bash"
	 * @example
	 * shell: "powershell"
	 *
	 * @default The shell is determined automatically based on the operating system
	 * and job configuration.
	 */
	readonly shell?: string;

	/**
	 * Defines the working directory for the step.
	 *
	 * The `workingDirectory` specifies the file path where the command should be executed.
	 * This can be an absolute path or relative to the root of the GitHub workspace.
	 * If not specified, the default working directory is the GitHub workspace root
	 * (typically `/home/runner/work/{repo-name}/{repo-name}` on Linux runners).
	 *
	 * @example
	 * workingDirectory: "src"
	 * @example
	 * workingDirectory: "/home/runner/work/my-repo/my-repo"
	 */
	readonly workingDirectory?: string;
}

/**
 * Default settings applied to all steps within a job.
 *
 * `Defaults` provides a consistent configuration that applies to every step in the job,
 * ensuring uniformity in settings like `shell` and `workingDirectory`. These settings
 * can be overridden in individual steps as needed.
 */
export interface Defaults {
	/**
	 * Default run settings to apply across all steps in the job.
	 *
	 * Use `run` to define the shell and working directory settings that should
	 * be applied to each step, unless overridden at the step level.
	 */
	readonly run?: RunSettings;
}

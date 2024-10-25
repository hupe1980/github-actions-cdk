/**
 * Options for job concurrency control in GitHub Actions workflows.
 *
 * GitHub Actions concurrency allows you to limit and control the number of jobs or workflows
 * that can run simultaneously within a specified concurrency group. When concurrency is enabled,
 * GitHub will cancel or queue jobs to avoid duplicate or conflicting runs, ensuring that only
 * one job from the group runs at a time.
 *
 * For further details, see the GitHub Actions concurrency documentation:
 * @see https://docs.github.com/en/actions/using-jobs/using-concurrency
 */
export interface ConcurrencyOptions {
	/**
	 * The concurrency group to use for the job.
	 *
	 * The `group` property defines a unique identifier for the concurrency group. Only one job
	 * or workflow within the same concurrency group will run at a time. This group can be a
	 * simple string or a dynamically generated value using expressions.
	 *
	 * @example
	 * // Use a static group
	 * group: "deployment-group"
	 *
	 * @example
	 * // Use an expression to create a dynamic group for each branch
	 * group: "${{ github.ref }}"
	 */
	readonly group: string;

	/**
	 * Specifies whether to cancel any currently running jobs or workflows in the same concurrency group.
	 *
	 * If set to `true`, any currently running jobs or workflows within the same concurrency group
	 * will be canceled in favor of the latest job. If set to `false` or not provided, jobs will
	 * be queued to wait until any currently running jobs in the group complete.
	 *
	 * @default false
	 */
	readonly cancelInProgress?: boolean;
}

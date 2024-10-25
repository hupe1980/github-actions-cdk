import type { Job } from "./job";
import type { Step } from "./step";

/**
 * Properties required to configure an Action.
 */
export interface ActionProps {
	/**
	 * Optional name of the action to describe its function in the workflow.
	 *
	 * This name appears in GitHub Actions logs and provides a high-level
	 * description of what the action does.
	 *
	 * @example "Checkout Repository"
	 */
	readonly name?: string;

	/**
	 * The version of the action to use.
	 *
	 * This can be a specific version (e.g., "v2"), a tag (e.g., "main"),
	 * or a full commit SHA to ensure exact versioning. Specifying the
	 * version ensures that the Action will use the designated release
	 * or commit, providing stability and reproducibility in workflows.
	 *
	 * @example
	 * version: "v2"
	 */
	readonly version: string;
}

/**
 * Represents an abstract GitHub Action that can be bound to a Job.
 *
 * Actions are reusable units of code used in GitHub Actions workflows to
 * perform specific tasks. The `Action` class is intended to be extended
 * by other classes representing specific GitHub Actions, providing a
 * foundation for custom actions.
 *
 * @remarks
 * The `Action` class requires an `id` and `version` at instantiation, and
 * an implementation of the `bind` method to associate the Action with a
 * specific Job.
 */
export abstract class Action {
	/**
	 * The unique identifier for the action.
	 *
	 * This `id` is used to differentiate the action within a workflow.
	 * It must be unique across all actions within a single job.
	 */
	public readonly id: string;

	/**
	 * Optional name of the action for display in workflow logs.
	 */
	public readonly name?: string;

	/**
	 * The version of the action to be used in the workflow.
	 */
	public readonly version: string;

	/**
	 * Creates an Action instance.
	 *
	 * @param id - A unique identifier for the action, used to reference
	 * it within the workflow.
	 * @param props - The configuration properties for the action,
	 * including the `version`.
	 */
	constructor(id: string, props: ActionProps) {
		this.id = id;
		this.name = props.name;
		this.version = props.version;
	}

	/**
	 * Binds the action to a specified Job within the workflow.
	 *
	 * This method must be implemented by subclasses to define how
	 * the action interacts with and is configured for a given Job.
	 *
	 * @param job - The Job to which the Action should be bound.
	 * Binding associates the action's functionality and configuration
	 * with the job, integrating it into the workflow.
	 */
	public abstract bind(job: Job): Step;
}

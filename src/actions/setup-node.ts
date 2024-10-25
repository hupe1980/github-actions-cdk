import { Action, type ActionProps } from "../action";
import type { Job } from "../job";
import type { Step } from "../step";

export interface SetupNodeProps extends ActionProps {
	/**
	 * Version spec of the version to use in SemVer notation.
	 * It also admits such aliases as lts/*, latest, nightly and canary builds.
	 *
	 * @example
	 * Examples: 12.x, 10.15.1, >=10.15.0, lts/Hydrogen, 16-nightly, latest, node
	 */
	readonly nodeVersion: string;
}

export class SetupNode extends Action {
	public readonly nodeVersion: string;

	constructor(id: string, props: SetupNodeProps) {
		super(id, props);

		this.nodeVersion = props.nodeVersion;
	}

	public bind(job: Job): Step {
		return job.addStep(this.id, {
			uses: `actions/checkout@${this.version}`,
			with: {
				"node-version": this.nodeVersion,
			},
		});
	}
}

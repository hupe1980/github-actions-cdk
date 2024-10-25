import { Action, type ActionProps } from "../action";
import type { Job } from "../job";
import type { Step } from "../step";

export interface CheckoutProps extends ActionProps {
	readonly repository?: string;
}

export class Checkout extends Action {
	public readonly repository?: string;

	constructor(id: string, props: CheckoutProps) {
		super(id, props);

		this.repository = props.repository;
	}

	public bind(job: Job): Step {
		return job.addStep(this.id, {
			uses: `actions/checkout@${this.version}`,
			with: {
				repository: this.repository,
			},
		});
	}
}

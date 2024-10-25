import { Project, Step, Workflow } from "../src";
import { Checkout } from "../src/actions";

const project = new Project({
	outdir: "./example/.github/workflows",
});

// build.yml
const build = new Workflow(project, "build", {
	triggers: {
		push: {
			branches: ["main"],
		},
		pullRequest: {},
	},
});

const buildJob = build.addJob("build", {
	env: {
		CI: "true",
	},
});

buildJob.addAction(
	new Checkout("checkout", {
		version: "v4",
	}),
);

project.synth();

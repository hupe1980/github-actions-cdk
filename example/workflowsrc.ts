import { PermissionLevel, Project, Workflow } from "../src";
import { Checkout, SetupNode } from "../src/actions";

const project = new Project({
	outdir: "example/.github/workflows",
});

const workflow = new Workflow(project, "build", {
	triggers: {
		push: { branches: ["main"] },
		workflowDispatch: {},
	},
	permissions: {
		contents: PermissionLevel.READ,
	},
});

const job = workflow.addJob("build", {
	env: {
		CI: "true",
	},
});

job.addAction(
	new Checkout("checkout", {
		name: "Checkout Code",
		version: "v4",
	}),
);

job.addAction(
	new SetupNode("setup-node", {
		name: "Set up Node.js",
		version: "v4",
		nodeVersion: "20.x",
	}),
);

project.synth();

import { PermissionLevel, Project } from "../../../src";
import { CheckoutV4, SetupNodeV4 } from "../../../src/actions";

const project = new Project({
  //additionalChecks: true,
  outdir: `${__dirname}/.github/workflows`,
});

const workflow = project.addWorkflow("build", {
  name: "Build",
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

new CheckoutV4(job, "checkout", {
  name: "Checkout Code",
});

const setupNode = new SetupNodeV4(job, "setup-node", {
  name: "Set up Node.js",
  nodeVersion: "20.x",
});

job.addOutput("node-version", setupNode.outputs.nodeVersion);

project.synth();

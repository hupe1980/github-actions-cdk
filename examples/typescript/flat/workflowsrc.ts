import { PermissionLevel, Project, actions } from "github-actions-cdk";

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

new actions.CheckoutV4(job, "checkout", {
  name: "Checkout Code",
});

const setupNode = new actions.SetupNodeV4(job, "setup-node", {
  name: "Set up Node.js",
  nodeVersion: "20.x",
});

job.addOutput("node-version", setupNode.outputs.nodeVersion);

project.synth();

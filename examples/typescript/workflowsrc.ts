import { PermissionLevel, Project } from "../../src";
import { CheckoutV4, SetupNodeV4 } from "../../src/actions";

const project = new Project({
  //additionalChecks: true,
  outdir: "examples/typescript/.github/workflows",
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

job.addAction(
  new CheckoutV4("checkout", {
    name: "Checkout Code",
  }),
);

job.addAction(
  new SetupNodeV4("setup-node", {
    name: "Set up Node.js",
    nodeVersion: "20.x",
  }),
);

project.synth();

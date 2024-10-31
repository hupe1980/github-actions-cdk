import type { IConstruct } from "constructs";
import { Job, type JobProps, PermissionLevel, Project, actions } from "github-actions-cdk";

class CustomJob extends Job {
  constructor(scope: IConstruct, id: string, props: JobProps = {}) {
    super(scope, id, props);

    new actions.CheckoutV4(this, "checkout", {
      name: "Checkout Code",
    });

    new actions.SetupNodeV4(this, "setup-node", {
      name: "Set up Node.js",
      nodeVersion: "20.x",
    });
  }
}

const project = new Project({
  // additionalChecks: true,
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

new CustomJob(workflow, "build", {
  env: {
    CI: "true",
  },
});

project.synth();

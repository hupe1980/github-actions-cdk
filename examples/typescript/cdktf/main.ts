import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { CdktfAdapter } from "@github-actions-cdk/cdktf";
import { actions, Job } from "github-actions-cdk";

class GithubActionsStack extends TerraformStack {
    constructor(scope: Construct, ns: string) {
      super(scope, ns);

      new AwsProvider(this, "aws", {
        region: "eu-central-1",
      });

      const adapter = new CdktfAdapter(this, {
        outdir:  `${__dirname}/.github/workflows`,
      });

      const workflow = adapter.addWorkflow("build", {
        name: "Build",
      });

      const job = new Job(workflow, "build", {
        name: "Build",
      });

      new actions.CheckoutV4(job, "checkout", {
        name: "Checkout",
      });
    }
}

const app = new App();
new GithubActionsStack(app, "GithubActionsStack");
app.synth();
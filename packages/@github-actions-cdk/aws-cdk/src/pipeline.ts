import { Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AwsCdkAdapter } from "./adapter";
import type { AwsCredentialsProvider } from "./aws-credentials";
import { PublishJob } from "./publish";
import { type Synth, SynthJob } from "./synth";

export interface GitHubActionsPipelineProps {
  readonly workflowName?: string;
  readonly workflowOutdir?: string;
  readonly synth: Synth;
  readonly awsCredentials: AwsCredentialsProvider;
}

export class GitHubActionsPipeline extends Construct {
  constructor(scope: Construct, id: string, props: GitHubActionsPipelineProps) {
    super(scope, id);

    const app = Stage.of(this);
    if (!app) {
      throw new Error("The GitHub Workflow must be defined in the scope of an App");
    }

    const adapter = new AwsCdkAdapter(this, {
      outdir: props.workflowOutdir,
    });

    const workflow = adapter.addWorkflow("build", {
      name: props.workflowName ?? "Build",
    });

    const synthJob = new SynthJob(workflow, "synth", {
      synth: props.synth,
      cdkOutdir: app.outdir,
      awsCredentials: props.awsCredentials,
    });

    const publishJob = new PublishJob(workflow, "publish", {
      cdkOutdir: app.outdir,
      awsCredentials: props.awsCredentials
    });

    publishJob.addDependency(synthJob);
  }
}

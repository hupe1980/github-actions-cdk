import type { Construct } from "constructs";
import { Job, PermissionLevel, RunStep, actions } from "github-actions-cdk";
import type { AwsCredentialsProvider } from "./aws-credentials";
import { CDKOUT_ARTIFACT } from "./common";



export interface Synth {
  readonly commands: string[];
  readonly installCommands?: string[];
  readonly env?: Record<string, string>;
}

export interface SynthJobProps {
  readonly synth: Synth;
  readonly cdkOutdir: string;
  readonly awsCredentials: AwsCredentialsProvider;
}

export class SynthJob extends Job {
  constructor(scope: Construct, id: string, props: SynthJobProps) {
    super(scope, id, {
      permissions: {
        contents: PermissionLevel.READ,
        idToken: props.awsCredentials.permissionLevel(),
      },
      env: props.synth.env,
    });

    new actions.CheckoutV4(this, "checkout", {
      name: "Checkout",
    });

    // preBuildSteps

    if (props.synth.installCommands && props.synth.installCommands.length > 0) {
      new RunStep(this, "install", {
        name: "Install",
        run: props.synth.installCommands,
      });
    }

    new RunStep(this, "build", {
      name: "Build",
      run: props.synth.commands,
    });

    // postBuildSteps

    new actions.UploadArtifactV4(this, "upload", {
      name: `Upload ${CDKOUT_ARTIFACT}`,
      artifactName: CDKOUT_ARTIFACT,
      path: props.cdkOutdir,
      includeHiddenFiles: true,
    });
  }
}

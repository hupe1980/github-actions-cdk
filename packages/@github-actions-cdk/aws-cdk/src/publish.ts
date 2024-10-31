import type { Construct } from "constructs";
import { Job, PermissionLevel, actions } from "github-actions-cdk";
import type { AwsCredentialsProvider } from "./aws-credentials";
import { CDKOUT_ARTIFACT } from "./common";

export interface PublishJobProps {
  readonly cdkOutdir: string;
  readonly awsCredentials: AwsCredentialsProvider;
}

export class PublishJob extends Job {
  constructor(scope: Construct, id: string, props: PublishJobProps) {
    super(scope, id, {
      permissions: {
        contents: PermissionLevel.READ,
        idToken: props.awsCredentials.permissionLevel(),
      },
    });

    new actions.DownloadArtifactV4(this, "DownloadArtifact", {
      name: `Download ${CDKOUT_ARTIFACT}`,
      artifactName: CDKOUT_ARTIFACT,
      path: props.cdkOutdir,
    });
  }
}

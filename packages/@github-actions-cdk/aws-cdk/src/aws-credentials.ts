import type { IRole } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { PermissionLevel, type RegularStep, actions } from "github-actions-cdk";

export abstract class AwsCredentialsProvider extends Construct {
  public abstract permissionLevel(): PermissionLevel;
  public abstract credentialSteps(region: string, assumeRoleArn?: string): RegularStep[];
}

export interface GitHubSecretsProviderProps {
  /**
   * @default "AWS_ACCESS_KEY_ID"
   */
  readonly accessKeyId: string;

  /**
   * @default "AWS_SECRET_ACCESS_KEY"
   */
  readonly secretAccessKey: string;

  /**
   * @default - no session token is used
   */
  readonly sessionToken?: string;
}

class GitHubSecretsProvider extends AwsCredentialsProvider {
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly sessionToken?: string;

  constructor(scope: Construct, id: string, props?: GitHubSecretsProviderProps) {
    super(scope, id);
    this.accessKeyId = props?.accessKeyId ?? "AWS_ACCESS_KEY_ID";
    this.secretAccessKey = props?.secretAccessKey ?? "AWS_SECRET_ACCESS_KEY";
    this.sessionToken = props?.sessionToken;
  }

  public permissionLevel(): PermissionLevel {
    return PermissionLevel.NONE;
  }

  public credentialSteps(region: string, assumeRoleArn?: string): RegularStep[] {
    return [
      new actions.ConfigureAwsCredentialsV4(this, "id", {
        name: "Authenticate Via GitHub Secrets",
        awsRegion: region,
        awsAccessKeyId: `\${{ secrets.${this.accessKeyId} }}`,
        awsSecretAccessKey: `\${{ secrets.${this.secretAccessKey} }}`,
        ...(this.sessionToken
          ? {
              sessionToken: `\${{ secrets.${this.sessionToken} }}`,
            }
          : undefined),
        ...(assumeRoleArn
          ? {
              roleToAssume: assumeRoleArn,
              roleExternalId: "Pipeline",
            }
          : undefined),
      }),
    ];
  }
}

export interface OpenIdConnectProviderProps {
  /**
   * A role that utilizes the GitHub OIDC Identity Provider in your AWS account.
   *
   * You can create your own role in the console with the necessary trust policy
   * to allow gitHub actions from your gitHub repository to assume the role, or
   * you can utilize the `GitHubActionRole` construct to create a role for you.
   */
  readonly gitHubActionsRole: IRole;

  /**
   * The role session name to use when assuming the role.
   *
   * @default - no role session name
   */
  readonly roleSessionName?: string;
}

class OpenIdConnectProvider extends AwsCredentialsProvider {
  private readonly gitHubActionsRole: IRole;
  private readonly roleSessionName: string | undefined;

  constructor(scope: Construct, id: string, props: OpenIdConnectProviderProps) {
    super(scope, id);

    this.gitHubActionsRole = props.gitHubActionsRole;
    this.roleSessionName = props.roleSessionName;
  }

  public permissionLevel(): PermissionLevel {
    return PermissionLevel.WRITE;
  }

  public credentialSteps(region: string, assumeRoleArn?: string): RegularStep[] {
    const steps: RegularStep[] = [];

    steps.push(
      new actions.ConfigureAwsCredentialsV4(this, "authenticate", {
        name: "Authenticate Via OIDC",
        awsRegion: region,
        roleToAssume: this.gitHubActionsRole.roleArn,
        roleSessionName: this.roleSessionName,
      }),
    );

    if (assumeRoleArn) {
      function getDeployRole(arn: string) {
        return arn.replace("cfn-exec", "deploy");
      }

      steps.push(
        new actions.ConfigureAwsCredentialsV4(this, "assume-role", {
          name: "Assume CDK Deploy Role",
          awsRegion: region,
          awsAccessKeyId: "${{ env.AWS_ACCESS_KEY_ID }}",
          awsSecretAccessKey: "${{ env.AWS_SECRET_ACCESS_KEY }}",
          awsSessionToken: "${{ env.AWS_SESSION_TOKEN }}",
          roleToAssume: getDeployRole(assumeRoleArn),
          roleExternalId: "Pipeline",
        }),
      );
    }

    return steps;
  }
}

export class AwsCredentials {
  static fromGitHubSecrets(
    scope: Construct,
    props?: GitHubSecretsProviderProps,
  ): AwsCredentialsProvider {
    return new GitHubSecretsProvider(scope, "GitHubSecretsProvider", props);
  }

  static fromOpenIdConnect(
    scope: Construct,
    props: OpenIdConnectProviderProps,
  ): AwsCredentialsProvider {
    return new OpenIdConnectProvider(scope, "OpenIdConnectProvider", props);
  }
}

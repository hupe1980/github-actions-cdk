import { Token } from "aws-cdk-lib";
import {
  Expression,
  type Job,
  PermissionLevel,
  type RegularStep,
  actions,
} from "github-actions-cdk";

/**
 * Abstract base class representing a provider for AWS credentials.
 *
 * @remarks
 * Concrete implementations of `AwsCredentialsProvider` define how
 * AWS credentials are obtained and configured within GitHub Actions jobs.
 */
export abstract class AwsCredentialsProvider {
  /**
   * Retrieves the permission level required by this credentials provider.
   *
   * @returns The permission level that this provider requires.
   */
  abstract permissionLevel(): PermissionLevel;

  /**
   * Generates steps to configure AWS credentials for a GitHub Actions job.
   *
   * @param job - The GitHub Actions job in which to configure the credentials.
   * @param region - The AWS region in which the credentials will be used.
   * @param assumeRoleArn - An optional ARN for a role to assume with elevated permissions.
   * @returns An array of `RegularStep` instances to be executed in the job.
   */
  abstract credentialSteps(job: Job, region: string, assumeRoleArn?: string): RegularStep[];
}

/**
 * Properties for configuring the GitHub Secrets provider.
 */
export interface GitHubSecretsProviderProps {
  /** The name of the GitHub secret that holds the AWS access key ID. Defaults to "AWS_ACCESS_KEY_ID". */
  readonly accessKeyId?: string;

  /** The name of the GitHub secret that holds the AWS secret access key. Defaults to "AWS_SECRET_ACCESS_KEY". */
  readonly secretAccessKey?: string;

  /** The name of the GitHub secret that holds the AWS session token, if applicable. */
  readonly sessionToken?: string;
}

/**
 * AWS credentials provider that retrieves credentials from GitHub Secrets.
 */
class GitHubSecretsProvider extends AwsCredentialsProvider {
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly sessionToken?: string;

  constructor(props: GitHubSecretsProviderProps = {}) {
    super();
    this.accessKeyId = props.accessKeyId ?? "AWS_ACCESS_KEY_ID";
    this.secretAccessKey = props.secretAccessKey ?? "AWS_SECRET_ACCESS_KEY";
    this.sessionToken = props.sessionToken;
  }

  public permissionLevel(): PermissionLevel {
    return PermissionLevel.NONE;
  }

  public credentialSteps(job: Job, region: string, assumeRoleArn?: string): RegularStep[] {
    return [
      new actions.ConfigureAwsCredentialsV4(job, "id", {
        name: "Authenticate Via GitHub Secrets",
        awsRegion: region,
        awsAccessKeyId: Expression.fromSecrets(this.accessKeyId),
        awsSecretAccessKey: Expression.fromSecrets(this.secretAccessKey),
        ...(this.sessionToken ? { sessionToken: Expression.fromSecrets(this.sessionToken) } : {}),
        ...(assumeRoleArn ? { roleToAssume: assumeRoleArn, roleExternalId: "Pipeline" } : {}),
      }),
    ];
  }
}

/**
 * Properties for configuring the OpenID Connect provider.
 */
export interface OpenIdConnectProviderProps {
  /** The ARN of the role that GitHub Actions will assume via OpenID Connect. */
  readonly gitHubActionsRoleArn: string;

  /** Optional role session name to use when assuming the role. */
  readonly roleSessionName?: string;
}

/**
 * AWS credentials provider that uses OpenID Connect for authentication.
 */
class OpenIdConnectProvider extends AwsCredentialsProvider {
  private readonly gitHubActionsRoleArn: string;
  private readonly roleSessionName?: string;

  constructor(props: OpenIdConnectProviderProps) {
    super();
    if (Token.isUnresolved(props.gitHubActionsRoleArn)) {
      throw new Error(
        `The provided gitHubActionsRoleArn (${props.gitHubActionsRoleArn}) is unresolved. Please provide a concrete value.`,
      );
    }

    this.gitHubActionsRoleArn = props.gitHubActionsRoleArn;
    this.roleSessionName = props.roleSessionName;
  }

  public permissionLevel(): PermissionLevel {
    return PermissionLevel.WRITE;
  }

  public credentialSteps(job: Job, region: string, assumeRoleArn?: string): RegularStep[] {
    const steps: RegularStep[] = [
      new actions.ConfigureAwsCredentialsV4(job, "authenticate", {
        name: "Authenticate Via OIDC",
        awsRegion: region,
        roleToAssume: this.gitHubActionsRoleArn,
        roleSessionName: this.roleSessionName,
      }),
    ];

    if (assumeRoleArn) {
      const getDeployRole = (arn: string) => arn.replace("cfn-exec", "deploy");

      steps.push(
        new actions.ConfigureAwsCredentialsV4(job, "assume-role", {
          name: "Assume CDK Deploy Role",
          awsRegion: region,
          awsAccessKeyId: Expression.fromEnv("AWS_ACCESS_KEY_ID"),
          awsSecretAccessKey: Expression.fromEnv("AWS_SECRET_ACCESS_KEY"),
          awsSessionToken: Expression.fromEnv("AWS_SESSION_TOKEN"),
          roleToAssume: getDeployRole(assumeRoleArn),
          roleExternalId: "Pipeline",
        }),
      );
    }

    return steps;
  }
}

/**
 * Helper class for generating ARNs for GitHub Actions roles.
 */
export class GitHubActionsRoleArn {
  /**
   * Creates an ARN for a GitHub Actions role based on the account ID.
   *
   * @param accountId - The AWS account ID.
   * @param roleName - The name of the IAM role (defaults to "GitHubActionsRole").
   * @returns The full ARN of the specified role.
   */
  public static fromAccount(accountId: string, roleName = "GitHubActionsRole"): string {
    return `arn:aws:iam::${accountId}:role/${roleName}`;
  }
}

/**
 * Factory class for creating instances of AWS credentials providers.
 */
export class AwsCredentials {
  /**
   * Creates an AWS credentials provider that uses GitHub secrets.
   *
   * @param props - Optional properties for configuring the GitHub Secrets provider.
   * @returns An instance of `GitHubSecretsProvider`.
   */
  static fromGitHubSecrets(props?: GitHubSecretsProviderProps): AwsCredentialsProvider {
    return new GitHubSecretsProvider(props);
  }

  /**
   * Creates an AWS credentials provider that uses OpenID Connect.
   *
   * @param props - Properties for configuring the OpenID Connect provider.
   * @returns An instance of `OpenIdConnectProvider`.
   */
  static fromOpenIdConnect(props: OpenIdConnectProviderProps): AwsCredentialsProvider {
    return new OpenIdConnectProvider(props);
  }
}

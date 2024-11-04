import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { IamOpenidConnectProvider } from "@cdktf/provider-aws/lib/iam-openid-connect-provider";
import { IamRole, type IamRoleInlinePolicy } from "@cdktf/provider-aws/lib/iam-role";
import { Construct } from "constructs";

// GitHub OIDC provider thumbprints
const GITHUB_OIDC_THUMBPRINTS = [
  "6938fd4d98bab03faadb97b34396831e3780aea1",
  "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
];

// GitHub Actions OIDC token endpoint
const RAW_ENDPOINT = "token.actions.githubusercontent.com";
const PROVIDER_URL = `https://${RAW_ENDPOINT}`;

/**
 * Interface for an OpenID Connect (OIDC) provider that GitHub Actions can use.
 */
export interface IOpenIdConnectProvider {
  /**
   * The Amazon Resource Name (ARN) of the OIDC provider.
   */
  readonly providerArn: string;
}

/**
 * Properties for configuring the GitHub Actions OpenID Connect provider.
 */
export interface GitHubActionsOpenIdConnectProviderProps {
  /**
   * Optional thumbprints to verify GitHub's certificates.
   * Default is the predefined thumbprints.
   */
  readonly thumbprints?: string[];
}

/**
 * Represents an OpenID Connect (OIDC) provider for GitHub Actions.
 *
 * This construct creates an IAM OIDC provider that allows GitHub Actions
 * to assume roles using web identity federation.
 */
export class GitHubActionsOpenIdConnectProvider
  extends Construct
  implements IOpenIdConnectProvider
{
  /**
   * The Amazon Resource Name (ARN) of the created OpenID Connect provider.
   */
  public readonly providerArn: string;

  /**
   * Constructs a new instance of `GitHubActionsOpenIdConnectProvider`.
   *
   * @param scope - The construct scope to define the provider within.
   * @param id - The unique identifier for this provider.
   * @param props - Optional properties for the OIDC provider.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsOpenIdConnectProviderProps = {}) {
    super(scope, id);

    const thumbprints = props.thumbprints ?? GITHUB_OIDC_THUMBPRINTS;

    const provider = new IamOpenidConnectProvider(this, "GitHubProvider", {
      url: PROVIDER_URL,
      clientIdList: ["sts.amazonaws.com"],
      thumbprintList: thumbprints,
    });

    this.providerArn = provider.arn;
  }

  /**
   * Imports an existing GitHub Actions OpenID Connect provider by ARN.
   *
   * @param scope - The construct scope to define the provider within.
   * @returns An object that implements `IOpenIdConnectProvider`.
   */
  public static fromGitHubActionsOpenIdConnectProvider(scope: Construct): IOpenIdConnectProvider {
    const callerIdentity = new DataAwsCallerIdentity(scope, "CallerIdentity");
    const arn = `arn:aws:iam::${callerIdentity.accountId}:oidc-provider/${RAW_ENDPOINT}`;

    return {
      providerArn: arn,
    };
  }
}

/**
 * Properties for creating a GitHub Actions IAM role.
 */
export interface GitHubActionsRoleProps {
  /**
   * The name for the GitHub Actions IAM role.
   *
   * @default - "GitHubActionsRole"
   */
  readonly roleName?: string;

  /**
   * The OpenID Connect provider that GitHub Actions will use to assume this role.
   */
  readonly provider: IOpenIdConnectProvider;

  /**
   * A list of GitHub repositories that are permitted to assume this role.
   *
   * Each repository should be formatted as `owner/repo`.
   */
  readonly repos?: string[];

  /**
   * Additional custom subject claims to allow for the role.
   *
   * Each claim should conform to the format used in GitHub OIDC conditions.
   */
  readonly subjectClaims?: string[];

  /**
   * Inline policies that define the permissions for the IAM role.
   * This allows configuring the role with specific policies.
   */
  readonly inlinePolicy?: IamRoleInlinePolicy[];
}

/**
 * Creates an IAM Role for GitHub Actions workflows using an OpenID Connect provider.
 *
 * The role includes policies allowing the assumption of bootstrap roles and access to ECR authorization.
 */
export class GitHubActionsRole extends IamRole {
  /**
   * Constructs a new instance of `GitHubActionsRole`.
   *
   * @param scope - The construct scope to define the role within.
   * @param id - The unique identifier for this role.
   * @param props - The properties for configuring the GitHub Actions role.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsRoleProps) {
    super(scope, id, {
      name: props.roleName ?? "GitHubActionsRole",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Federated: props.provider.providerArn,
            },
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringLike: {
                [`${RAW_ENDPOINT}:sub`]: formatRepos(props.repos ?? []).concat(
                  props.subjectClaims ?? [],
                ),
                [`${RAW_ENDPOINT}:aud`]: "sts.amazonaws.com",
              },
            },
          },
        ],
      }),
      inlinePolicy: props.inlinePolicy,
    });
  }
}

/**
 * Formats GitHub repository identifiers for the OIDC `sub` claim.
 *
 * Each entry is formatted as `repo:owner/repo:*`.
 *
 * @param repos - A list of GitHub repositories in the format `owner/repo`.
 * @returns A list of formatted repository subject claims.
 */
function formatRepos(repos: string[]): string[] {
  return repos.map((repo) => `repo:${repo}:*`);
}

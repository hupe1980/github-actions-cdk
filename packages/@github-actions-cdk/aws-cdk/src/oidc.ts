import { Aws } from "aws-cdk-lib";
import {
  Effect,
  FederatedPrincipal,
  type IOpenIdConnectProvider,
  OpenIdConnectProvider,
  PolicyDocument,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

/**
 * GitHub OIDC provider thumbprints, updated as of 2023-07-27.
 *
 * For details and future updates, see:
 * https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
 */
const GITHUB_OIDC_THUMBPRINTS = [
  "6938fd4d98bab03faadb97b34396831e3780aea1",
  "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
];

/** GitHub Actions OIDC token endpoint */
const RAW_ENDPOINT = "token.actions.githubusercontent.com";
const PROVIDER_URL = `https://${RAW_ENDPOINT}`;

/**
 * Properties for configuring the GitHub Actions OpenID Connect provider.
 */
export interface GitHubActionsOpenIdConnectProviderProps {
  /**
   * Optional thumbprints to verify GitHub's certificates.
   *
   * Ensure to update these when GitHub rotates their certificates.
   *
   * @default - Uses predefined, up-to-date thumbprints.
   */
  readonly thumbprints?: string[];
}

/**
 * Represents an OpenID Connect (OIDC) provider for GitHub Actions.
 *
 * This provider allows GitHub Actions to assume roles in AWS by connecting through OpenID Connect.
 */
export class GitHubActionsOpenIdConnectProvider extends Construct {
  /**
   * Imports an existing GitHub Actions OpenID Connect provider by ARN.
   *
   * @param scope - The construct scope to define the provider within.
   * @returns The imported OIDC provider interface.
   */
  public static fromGitHubActionsOpenIdConnectProvider(scope: Construct): IOpenIdConnectProvider {
    return OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      scope,
      "GitHubActionProvider",
      `arn:${Aws.PARTITION}:iam::${Aws.ACCOUNT_ID}:oidc-provider/${RAW_ENDPOINT}`,
    );
  }

  /**
   * Constructs a new instance of `GitHubActionsOpenIdConnectProvider`.
   *
   * @param scope - The construct scope to define the provider within.
   * @param id - The unique identifier for this provider.
   * @param props - Optional properties for the OpenID Connect provider.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsOpenIdConnectProviderProps = {}) {
    super(scope, id);

    new OpenIdConnectProvider(this, "GitHubProvider", {
      url: PROVIDER_URL,
      clientIds: ["sts.amazonaws.com"],
      thumbprints: props.thumbprints ?? GITHUB_OIDC_THUMBPRINTS,
    });
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
}

/**
 * Creates an IAM Role for GitHub Actions workflows using an OpenID Connect provider.
 *
 * The role includes policies allowing the assumption of bootstrap roles and access to ECR authorization.
 */
export class GitHubActionsRole extends Role {
  /**
   * Constructs a new instance of `GitHubActionsRole`.
   *
   * @param scope - The construct scope to define the role within.
   * @param id - The unique identifier for this role.
   * @param props - The properties for configuring the GitHub Actions role.
   */
  constructor(scope: Construct, id: string, props: GitHubActionsRoleProps) {
    super(scope, id, {
      roleName: props.roleName ?? "GitHubActionsRole",
      assumedBy: new FederatedPrincipal(
        props.provider.openIdConnectProviderArn,
        {
          StringLike: {
            [`${RAW_ENDPOINT}:sub`]: formatRepos(props.repos ?? []).concat(
              props.subjectClaims ?? [],
            ),
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
      inlinePolicies: {
        AssumeBootstrapRoles: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["sts:AssumeRole"],
              resources: ["*"],
              conditions: {
                "ForAnyValue:StringEquals": {
                  "iam:ResourceTag/aws-cdk:bootstrap-role": [
                    "deploy",
                    "lookup",
                    "file-publishing",
                    "image-publishing",
                  ],
                },
              },
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["ecr:GetAuthorizationToken"],
              resources: ["*"],
            }),
          ],
        }),
      },
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

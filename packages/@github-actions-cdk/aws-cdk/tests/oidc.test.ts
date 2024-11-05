import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { GitHubActionsOpenIdConnectProvider, GitHubActionsRole } from "../src";

function createStackWithProvider() {
  const stack = new Stack();
  const provider = GitHubActionsOpenIdConnectProvider.fromGitHubActionsOpenIdConnectProvider(stack);
  return { stack, provider };
}

describe("GithubActionRole construct", () => {
  test("basic configuration with one repo", () => {
    // GIVEN
    const { stack, provider } = createStackWithProvider();

    // WHEN
    new GitHubActionsRole(stack, "MyProvider", {
      provider,
      repos: ["myuser/myrepo"],
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringLike: {
                "token.actions.githubusercontent.com:sub": ["repo:myuser/myrepo:*"],
              },
            },
            Principal: {
              Federated: {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    { Ref: "AWS::Partition" },
                    ":iam::",
                    { Ref: "AWS::AccountId" },
                    ":oidc-provider/token.actions.githubusercontent.com",
                  ],
                ],
              },
            },
          },
        ],
      },
    });
  });

  test("basic configuration with multiple repos and subject claims", () => {
    // GIVEN
    const { stack, provider } = createStackWithProvider();

    // WHEN
    new GitHubActionsRole(stack, "MyProvider", {
      provider,
      repos: ["myuser/myrepo", "myuser/myrepo2", "myuser/myrepo3"],
      subjectClaims: [
        "repo:owner/repo1:ref:refs/heads/branch1",
        "repo:owner/repo1:environment:prod",
      ],
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringLike: {
                "token.actions.githubusercontent.com:sub": [
                  "repo:myuser/myrepo:*",
                  "repo:myuser/myrepo2:*",
                  "repo:myuser/myrepo3:*",
                  "repo:owner/repo1:ref:refs/heads/branch1",
                  "repo:owner/repo1:environment:prod",
                ],
              },
            },
            Principal: {
              Federated: {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    { Ref: "AWS::Partition" },
                    ":iam::",
                    { Ref: "AWS::AccountId" },
                    ":oidc-provider/token.actions.githubusercontent.com",
                  ],
                ],
              },
            },
          },
        ],
      },
    });
  });

  test("Policy has correct permissions", () => {
    // GIVEN
    const { stack, provider } = createStackWithProvider();

    // WHEN
    new GitHubActionsRole(stack, "MyProvider", {
      provider,
      repos: ["myuser/myrepo"],
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties("AWS::IAM::Role", {
      Policies: [
        {
          PolicyDocument: {
            Statement: [
              {
                Action: "sts:AssumeRole",
                Resource: "*",
                Effect: "Allow",
                Condition: {
                  "ForAnyValue:StringEquals": {
                    "iam:ResourceTag/aws-cdk:bootstrap-role": [
                      "deploy",
                      "lookup",
                      "file-publishing",
                      "image-publishing",
                    ],
                  },
                },
              },
              {
                Action: "ecr:GetAuthorizationToken",
                Resource: "*",
                Effect: "Allow",
              },
            ],
          },
        },
      ],
    });
  });
});

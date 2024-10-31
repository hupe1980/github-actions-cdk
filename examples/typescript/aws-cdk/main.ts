import { AwsCredentials, GitHubActionsOpenIdConnectProvider, GitHubActionsPipeline, GitHubActionsRole } from '@github-actions-cdk/aws-cdk';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

class GithubActionsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const provider = GitHubActionsOpenIdConnectProvider.fromGitHubActionsOpenIdConnectProvider(this);

        const gitHubActionsRole = new GitHubActionsRole(this, 'GitHubActionsRole', {
            provider,
        });

        new GitHubActionsPipeline(this, 'Pipeline', {
            workflowOutdir: `${__dirname}/.github/workflows`,
            synth: {
                commands: ['npx cdk synth'],
            },
            awsCredentials: AwsCredentials.fromOpenIdConnect(this, {
                gitHubActionsRole,
            }),
        });
    }
}

const app = new App();
new GithubActionsStack(app, 'GithubActionsStack');

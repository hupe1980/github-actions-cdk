import { AwsCredentials, GitHubActionsOpenIdConnectProvider, GitHubActionsPipeline, GitHubActionsRole, StageJob, Synth } from '@github-actions-cdk/aws-cdk';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { MyStage } from './my-stage';
import { RunStep } from 'github-actions-cdk';

class GithubActionsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const provider = GitHubActionsOpenIdConnectProvider.fromGitHubActionsOpenIdConnectProvider(this);

        new GitHubActionsRole(this, 'GitHubActionsRole', {
            provider,
        });

        const pipeline = new GitHubActionsPipeline(this, 'Pipeline', {
            workflowOutdir: `${__dirname}/.github/workflows`,
            // singlePublisherPerAssetType: true,
            preBuild: { steps: (job) => {
                new RunStep(job, 'pre', {
                    run: 'echo "Hello, world!"',
                });
            }},
            synth: new Synth({
                commands: ["npm install", "npm run build"],
            }),
            awsCredentials: AwsCredentials.fromOpenIdConnect({
                gitHubActionsRoleArn: "arn:aws:iam::<account-id>:role/GitHubActionsRole",
            }),
        });

        // a wave deploys all stages concurrently
        const prod = pipeline.addWave('Prod');

        const ACCOUNT = '123456789012';
        prod.addStage(new MyStage(app, 'US', { env: { account: ACCOUNT, region: 'us-east-1' } }), {
            preJobs: [new StageJob("hello-world", {
                name: 'Hello World',
                steps: (job) => {
                    new RunStep(job, 'echo', {
                        run: 'echo "Hello world"',
                    });
                } 
            })],
        });
        prod.addStage(new MyStage(app, 'EU', { env: { account: ACCOUNT, region: 'eu-west-2' } }));
    }
}

const app = new App();
new GithubActionsStack(app, 'GithubActionsStack');

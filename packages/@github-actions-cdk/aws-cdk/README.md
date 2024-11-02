# @github-actions-cdk/aws-cdk

**@github-actions-cdk/aws-cdk** is a TypeScript library for building GitHub Actions pipelines specifically for AWS CDK applications. This library allows developers to define, structure, and automate CI/CD workflows tailored to CDK projects, making it easy to deploy infrastructure through GitHub Actions in a type-safe and modular way.

## Key Features

- **Type-Safe Workflow Definition**: Use TypeScript to define GitHub Actions workflows with strict typing, ensuring correctness and reducing errors.
- **Purpose-Built for AWS CDK**: Integrates directly with AWS CDK, making it simple to add deployment stages, manage dependencies, and automate CDK operations.
- **Modular Components**: Quickly set up workflows by creating reusable jobs, triggers, and custom deployment stages.

## Installation

To get started with `@github-actions-cdk/aws-cdk`, install the package using npm or yarn:

```bash
npm install @github-actions-cdk/aws-cdk
```

or

```bash
yarn add @github-actions-cdk/aws-cdk
```

## Getting Started

### Basic Usage
Here’s an example of how to create a GitHub Actions workflow for an AWS CDK app using @github-actions-cdk/aws-cdk in TypeScript:

```typescript
// main.ts
import { AwsCredentials, GitHubActionsOpenIdConnectProvider, GitHubActionsPipeline, GitHubActionsRole, StageJob, Synth } from '@github-actions-cdk/aws-cdk';
import { RunStep } from 'github-actions-cdk';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { MyStage } from './my-stage';

class GithubActionsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const provider = GitHubActionsOpenIdConnectProvider.fromGitHubActionsOpenIdConnectProvider(this);

        new GitHubActionsRole(this, 'GitHubActionsRole', {
            provider,
        });

        const pipeline = new GitHubActionsPipeline(this, 'Pipeline', {
            workflowOutdir: `${__dirname}/.github/workflows`,
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
                        run: 'echo "Hello world!"',
                    });
                } 
            })],
        });
        prod.addStage(new MyStage(app, 'EU', { env: { account: ACCOUNT, region: 'eu-west-2' } }));
    }
}

const app = new App();
new GithubActionsStack(app, 'GithubActionsStack');

// my-stage.ts
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { App, RemovalPolicy, Stack, Stage, StageProps } from 'aws-cdk-lib';

const assets = path.join(__dirname, 'assets');

export class MyStage extends Stage {
  constructor(scope: App, id: string, props: StageProps = {}) {
    super(scope, id, props);

    const fnStack = new Stack(this, 'FunctionStack');
    const bucketStack = new Stack(this, 'BucketStack');

    const bucket = new s3.Bucket(bucketStack, 'Bucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const fn = new lambda.Function(fnStack, 'Function', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'assets', 'files')),
      handler: 'lambda.handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      environment: {
        BUCKET_NAME: bucket.bucketName, // <-- cross stack reference
      },
    });

    bucket.grantRead(fn);
  }
}
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to get involved.

## License

This project is licensed under the MIT License. See the [LICENSE](../../LICENCE) file for more information.

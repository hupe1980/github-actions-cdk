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
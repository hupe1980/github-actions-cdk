import { Action, type ActionProps } from "../action"; // Adjust the import path according to your project structure
import type { Job } from "../job";
import type { RegularStep } from "../step";

/**
 * List of valid AWS regions for credential configuration.
 */
const validAwsRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "af-south-1",
  "ap-east-1",
  "ap-south-1",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "me-south-1",
  "sa-east-1",
  "us-gov-west-1",
  "us-gov-east-1",
];

/**
 * Output structure for the Configure AWS Credentials action.
 *
 * Extends ActionOutputs to provide AWS credentials outputs such as `awsAccountId`, `awsAccessKeyId`, and session tokens.
 */
export interface ConfigureAwsCredentialsV4Outputs {
  /**
   * AWS Account ID associated with the credentials.
   */
  readonly awsAccountId: string;

  /**
   * AWS Access Key ID for the configured session.
   */
  readonly awsAccessKeyId: string;

  /**
   * AWS Secret Access Key for the configured session.
   */
  readonly awsSecretAccessKey: string;

  /**
   * AWS Session Token for temporary credentials (if applicable).
   */
  readonly awsSessionToken: string;
}

/**
 * Properties for configuring the Configure AWS Credentials action in a GitHub Actions workflow.
 *
 * This interface defines options for authentication, role assumption, and session parameters.
 */
export interface ConfigureAwsCredentialsV4Props extends ActionProps {
  /**
   * AWS Region to configure, e.g., `us-east-1`.
   *
   * Required field.
   */
  readonly awsRegion: string;

  /**
   * Optional Amazon Resource Name (ARN) of the IAM role to assume.
   */
  readonly roleToAssume?: string;

  /**
   * Optional AWS Access Key ID for direct configuration.
   */
  readonly awsAccessKeyId?: string;

  /**
   * Optional AWS Secret Access Key for direct configuration.
   */
  readonly awsSecretAccessKey?: string;

  /**
   * Optional AWS Session Token for direct configuration.
   */
  readonly awsSessionToken?: string;

  /**
   * Optional path to a web identity token file for identity federation.
   */
  readonly webIdentityTokenFile?: string;

  /**
   * Optional session duration (in seconds) for the assumed role, maximum is 43200 seconds (12 hours).
   */
  readonly roleDurationSeconds?: string;

  /**
   * Optional name for the assumed role session, useful for tracking purposes.
   */
  readonly roleSessionName?: string;

  /**
   * Determines if credentials should be exposed as step output, making them available for later workflow steps.
   *
   * @default false
   */
  readonly outputCredentials?: boolean;
}

/**
 * Class representing the Configure AWS Credentials action, allowing AWS credentials configuration
 * in a GitHub Actions workflow.
 *
 * This action supports multiple methods of credential setup, including direct access keys, session tokens, and role assumption.
 */
export class ConfigureAwsCredentialsV4 extends Action {
  public readonly awsRegion: string;
  public readonly roleToAssume?: string;
  public readonly awsAccessKeyId?: string;
  public readonly awsSecretAccessKey?: string;
  public readonly awsSessionToken?: string;
  public readonly webIdentityTokenFile?: string;
  public readonly roleDurationSeconds?: string;
  public readonly roleSessionName?: string;
  public readonly outputCredentials?: boolean;

  /**
   * Initializes a new instance of the `ConfigureAwsCredentials` action with specified properties.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the AWS credentials, including the region and optional access keys, roles, and session parameters.
   */
  constructor(id: string, props: ConfigureAwsCredentialsV4Props) {
    super(id, { version: "v4", ...props });

    this.awsRegion = props.awsRegion;
    this.roleToAssume = props.roleToAssume;
    this.awsAccessKeyId = props.awsAccessKeyId;
    this.awsSecretAccessKey = props.awsSecretAccessKey;
    this.awsSessionToken = props.awsSessionToken;
    this.webIdentityTokenFile = props.webIdentityTokenFile;
    this.roleDurationSeconds = props.roleDurationSeconds;
    this.roleSessionName = props.roleSessionName;
    this.outputCredentials = props.outputCredentials;
  }

  /**
   * Binds the action to a job by adding it as a step in the GitHub Actions workflow.
   *
   * Performs validation on the AWS region and adds step parameters based on the specified properties.
   *
   * @param job - The job to which the action is bound.
   * @returns The configured `RegularStep` instance for the GitHub Actions job.
   */
  public bind(job: Job): RegularStep {
    const step = job.addRegularStep(this.id, {
      name: this.renderName(),
      uses: this.renderUses("aws-actions/configure-aws-credentials"),
      parameters: {
        "aws-region": this.awsRegion,
        "role-to-assume": this.roleToAssume,
        "aws-access-key-id": this.awsAccessKeyId,
        "aws-secret-access-key": this.awsSecretAccessKey,
        "aws-session-token": this.awsSessionToken,
        "web-identity-token-file": this.webIdentityTokenFile,
        "role-duration-seconds": this.roleDurationSeconds,
        "role-session-name": this.roleSessionName,
        "output-credentials": this.outputCredentials,
      },
    });

    // Add validation for AWS region
    step.node.addValidation({
      validate: () => {
        const errors: string[] = [];

        if (!validAwsRegions.includes(this.awsRegion)) {
          errors.push(`Invalid AWS region specified: ${this.awsRegion}`);
        }

        return errors;
      },
    });

    return step;
  }

  /**
   * Retrieves the outputs of the Configure AWS Credentials action.
   *
   * This method returns an object containing output values that can be referenced in subsequent steps,
   * such as the account ID and session keys.
   *
   * @returns An object with the configured output credentials.
   */
  public get outputs(): ConfigureAwsCredentialsV4Outputs {
    return {
      awsAccountId: `\${{ steps.${this.id}.outputs.aws-account-id }}`,
      awsAccessKeyId: `\${{ steps.${this.id}.outputs.aws-access-key-id }}`,
      awsSecretAccessKey: `\${{ steps.${this.id}.outputs.aws-secret-access-key }}`,
      awsSessionToken: `\${{ steps.${this.id}.outputs.aws-session-token }}`,
    };
  }
}

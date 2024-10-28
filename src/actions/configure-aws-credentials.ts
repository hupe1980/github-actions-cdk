import { Action, type ActionProps } from "../action"; // Adjust the import path according to your project structure
import type { Job } from "../job";
import type { RegularStep } from "../step";

const validAwsRegions = [
  "us-east-1", // N. Virginia
  "us-east-2", // Ohio
  "us-west-1", // N. California
  "us-west-2", // Oregon
  "af-south-1", // Africa (Cape Town)
  "ap-east-1", // Asia Pacific (Hong Kong)
  "ap-south-1", // Asia Pacific (Mumbai)
  "ap-northeast-1", // Asia Pacific (Tokyo)
  "ap-northeast-2", // Asia Pacific (Seoul)
  "ap-southeast-1", // Asia Pacific (Singapore)
  "ap-southeast-2", // Asia Pacific (Sydney)
  "ca-central-1", // Canada (Central)
  "eu-central-1", // Europe (Frankfurt)
  "eu-west-1", // Europe (Ireland)
  "eu-west-2", // Europe (London)
  "eu-west-3", // Europe (Paris)
  "eu-north-1", // Europe (Stockholm)
  "me-south-1", // Middle East (Bahrain)
  "sa-east-1", // South America (São Paulo)
  "us-gov-west-1", // AWS GovCloud (US-West)
  "us-gov-east-1", // AWS GovCloud (US-East)
];

/**
 * Output structure for the Configure AWS Credentials action.
 */
export interface ConfigureAwsCredentialsOutputs {
  readonly awsAccountId: string;
  readonly awsAccessKeyId: string;
  readonly awsSecretAccessKey: string;
  readonly awsSessionToken: string;
}

/**
 * Properties for configuring the Configure AWS Credentials action in a GitHub Actions workflow.
 */
export interface ConfigureAwsCredentialsProps extends ActionProps {
  readonly awsRegion: string; // AWS Region
  readonly roleToAssume?: string; // ARN of the role to assume
  readonly awsAccessKeyId?: string; // AWS Access Key ID
  readonly awsSecretAccessKey?: string; // AWS Secret Access Key
  readonly awsSessionToken?: string; // AWS Session Token
  readonly webIdentityTokenFile?: string; // Path to web identity token file
  readonly roleDurationSeconds?: string; // Duration for the role in seconds
  readonly roleSessionName?: string; // Role session name
  readonly outputCredentials?: boolean; // Whether to set credentials as step output
}

/**
 * Class representing the Configure AWS Credentials action, allowing configuration of AWS credentials
 * within a GitHub Actions workflow.
 */
export class ConfigureAwsCredentials extends Action {
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
   * Initializes a new instance of the `ConfigureAwsCredentials` action.
   *
   * @param id - A unique identifier for the action instance.
   * @param props - Properties for configuring the Configure AWS Credentials action.
   */
  constructor(id: string, props: ConfigureAwsCredentialsProps) {
    super(id, props);

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
   * @param job - The job to bind the action to.
   * @returns The configured `RegularStep` for the GitHub Actions job.
   */
  public bind(job: Job): RegularStep {
    const step = job.addRegularStep(this.id, {
      name: this.name,
      uses: `./${this.id}`, // Use the correct action path
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

    step.node.addValidation({
      validate: () => {
        const errors: string[] = [];

        if (!validAwsRegions.includes(this.awsRegion)) {
          errors.push(`${this.awsRegion} is not a valid AWS region.`);
        }

        return errors;
      },
    });

    return step;
  }

  /**
   * Retrieves the outputs of the ConfigureAwsCredentials action.
   *
   * @returns An object containing the output values of the action.
   */
  public get outputs(): ConfigureAwsCredentialsOutputs {
    return {
      awsAccountId: `\${{ steps.${this.id}.outputs.aws-account-id }}`,
      awsAccessKeyId: `\${{ steps.${this.id}.outputs.aws-access-key-id }}`,
      awsSecretAccessKey: `\${{ steps.${this.id}.outputs.aws-secret-access-key }}`,
      awsSessionToken: `\${{ steps.${this.id}.outputs.aws-session-token }}`,
    };
  }
}

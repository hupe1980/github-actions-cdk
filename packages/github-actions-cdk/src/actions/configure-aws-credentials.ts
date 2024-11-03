import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

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
 * Provides outputs such as AWS account ID, access keys, and session tokens, enabling
 * subsequent steps in the workflow to use AWS credentials securely.
 */
export interface ConfigureAwsCredentialsV4Outputs {
  /**
   * The AWS account ID associated with the configured credentials.
   * This is typically the 12-digit account number linked to the credentials used.
   */
  readonly awsAccountId: string;

  /**
   * The AWS Access Key ID that allows programmatic access to AWS services.
   * This key should be handled securely and kept confidential.
   */
  readonly awsAccessKeyId: string;

  /**
   * The AWS Secret Access Key paired with the AWS Access Key ID.
   * This secret is used to authenticate and authorize requests to AWS.
   * It must be protected to prevent unauthorized access to AWS resources.
   */
  readonly awsSecretAccessKey: string;

  /**
   * A temporary session token associated with the AWS credentials, provided when using
   * temporary security credentials, such as those obtained through role assumption.
   * This token must accompany requests along with the Access Key ID and Secret Access Key.
   */
  readonly awsSessionToken: string;
}

/**
 * Properties for configuring the AWS credentials setup within a GitHub Actions workflow.
 *
 * Extends CommonActionProps to allow AWS-specific options, including access key IDs,
 * session tokens, and optional role assumption parameters.
 */
export interface ConfigureAwsCredentialsV4Props extends CommonActionProps {
  /**
   * AWS region to use for the action. Must be a valid AWS region.
   */
  readonly awsRegion: string;

  /**
   * Optional role ARN to assume for the AWS session.
   */
  readonly roleToAssume?: string;

  /**
   * AWS access key ID to use for credentials.
   */
  readonly awsAccessKeyId?: string;

  /**
   * AWS secret access key associated with the access key ID.
   */
  readonly awsSecretAccessKey?: string;

  /**
   * Session token for temporary AWS credentials.
   */
  readonly awsSessionToken?: string;

  /**
   * Path to a file containing a web identity token, used for assuming a role.
   */
  readonly webIdentityTokenFile?: string;

  /**
   * Duration, in seconds, for the assumed role session.
   */
  readonly roleDurationSeconds?: string;

  readonly roleExternalId?: string;

  /**
   * Name for the assumed role session.
   */
  readonly roleSessionName?: string;

  /**
   * If true, outputs the credentials for use in later steps.
   */
  readonly outputCredentials?: boolean;

  /**
   * Specifies the version of the action to use.
   */
  readonly version?: string;
}

/**
 * Configure AWS Credentials action for GitHub Actions.
 *
 * Enables AWS credentials setup via access keys, session tokens, and role assumption, allowing
 * workflow steps to interact with AWS services.
 */
export class ConfigureAwsCredentialsV4 extends Action {
  public static readonly IDENTIFIER = "aws-actions/configure-aws-credentials";

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
   * Initializes a new instance of the Configure AWS Credentials action.
   *
   * @param scope - Construct scope in which this action is defined.
   * @param id - Unique identifier for the action within a workflow.
   * @param props - Configuration properties for AWS credentials setup.
   */
  constructor(scope: IConstruct, id: string, props: ConfigureAwsCredentialsV4Props) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: ConfigureAwsCredentialsV4.IDENTIFIER,
      version: "v4",
      parameters: {
        "aws-region": props.awsRegion,
        "role-to-assume": props.roleToAssume,
        "aws-access-key-id": props.awsAccessKeyId,
        "aws-secret-access-key": props.awsSecretAccessKey,
        "aws-session-token": props.awsSessionToken,
        "web-identity-token-file": props.webIdentityTokenFile,
        "role-duration-seconds": props.roleDurationSeconds,
        "role-session-name": props.roleSessionName,
        "output-credentials": props.outputCredentials,
      },
    });

    // Validate AWS region
    if (!validAwsRegions.includes(props.awsRegion)) {
      throw new Error(`Invalid AWS region specified: ${props.awsRegion}`);
    }

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
   * Retrieves the outputs of the Configure AWS Credentials action, accessible for use in subsequent workflow steps.
   *
   * @returns AWS credentials outputs including account ID, access key, secret key, and session token.
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

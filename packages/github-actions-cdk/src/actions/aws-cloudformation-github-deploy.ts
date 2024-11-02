import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

/**
 * Output structure for the CloudFormation Deploy action.
 *
 * @remarks
 * This interface defines the specific outputs provided by the CloudFormation
 * Deploy action, including the `stackId` which is the identifier of the deployed stack.
 */
export interface AwsCloudFormationGitHubDeployV1Outputs {
  /**
   * The ID of the deployed CloudFormation stack.
   */
  readonly stackId: string;
}

/**
 * Configuration properties for the CloudFormation Deploy action in a GitHub Actions workflow.
 *
 * @remarks
 * Defines various options for deploying a CloudFormation stack, including stack configuration, parameters, and rollback options.
 */
export interface AwsCloudFormationGitHubDeployV1Props extends CommonActionProps {
  /**
   * The name of the CloudFormation stack.
   */
  readonly stackName: string;

  /**
   * Path or URL to the CloudFormation template.
   */
  readonly template: string;

  /**
   * Comma-delimited list of template capabilities to acknowledge.
   *
   * @default "CAPABILITY_IAM"
   */
  readonly capabilities?: string;

  /**
   * Parameters to override in the stack inputs.
   */
  readonly parameterOverrides?: string;

  /**
   * Set to skip executing the change set for review.
   *
   * @default "0"
   */
  readonly noExecuteChangeset?: "0" | "1";

  /**
   * Skip deletion of failed change sets.
   *
   * @default "0"
   */
  readonly noDeleteFailedChangeset?: "0" | "1";

  /**
   * Skip failure if the change set is empty.
   *
   * @default "0"
   */
  readonly noFailOnEmptyChangeset?: "0" | "1";

  /**
   * Disable rollback if stack creation fails.
   *
   * @default "0"
   */
  readonly disableRollback?: "0" | "1";

  /**
   * Timeout for stack creation in minutes.
   */
  readonly timeoutInMinutes?: number;

  /**
   * Comma-delimited list of SNS topic ARNs for stack-related events.
   */
  readonly notificationArns?: string;

  /**
   * ARN of IAM role for CloudFormation actions.
   */
  readonly roleArn?: string;

  /**
   * Key-value pairs as JSON for stack tags.
   */
  readonly tags?: string;

  /**
   * Enable termination protection for the stack.
   *
   * @default "0"
   */
  readonly terminationProtection?: "0" | "1";

  /**
   * Proxy for AWS SDK agent.
   */
  readonly httpProxy?: string;

  /**
   * Name of the change set to create.
   *
   * @default "<stack-name>-CS"
   */
  readonly changeSetName?: string;

  /**
   * Specifies the version of the action to use.
   */
  readonly version?: string;
}

/**
 * Deploy CloudFormation Stack action for GitHub Actions workflows.
 *
 * @remarks
 * Allows deployment of a CloudFormation stack with configuration options for
 * capabilities, parameters, rollback behavior, and notification settings.
 */
export class AwsCloudFormationGitHubDeployV1 extends Action {
  public readonly stackName: string;
  public readonly template: string;
  public readonly capabilities?: string;
  public readonly parameterOverrides?: string;
  public readonly noExecuteChangeset?: "0" | "1";
  public readonly noDeleteFailedChangeset?: "0" | "1";
  public readonly noFailOnEmptyChangeset?: "0" | "1";
  public readonly disableRollback?: "0" | "1";
  public readonly timeoutInMinutes?: number;
  public readonly notificationArns?: string;
  public readonly roleArn?: string;
  public readonly tags?: string;
  public readonly terminationProtection?: "0" | "1";
  public readonly httpProxy?: string;
  public readonly changeSetName?: string;
  public readonly version?: string;

  /**
   * Initializes a new instance of the CloudFormation Deploy action.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for CloudFormation stack deployment.
   */
  constructor(scope: IConstruct, id: string, props: AwsCloudFormationGitHubDeployV1Props) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: "aws-actions/aws-cloudformation-github-deploy",
      version: props.version ?? "v1",
      parameters: {
        name: props.stackName,
        template: props.template,
        capabilities: props.capabilities,
        "parameter-overrides": props.parameterOverrides,
        "no-execute-changeset": props.noExecuteChangeset,
        "no-delete-failed-changeset": props.noDeleteFailedChangeset,
        "no-fail-on-empty-changeset": props.noFailOnEmptyChangeset,
        "disable-rollback": props.disableRollback,
        "timeout-in-minutes": props.timeoutInMinutes,
        "notification-arns": props.notificationArns,
        "role-arn": props.roleArn,
        tags: props.tags,
        "termination-protection": props.terminationProtection,
        "http-proxy": props.httpProxy,
        "change-set-name": props.changeSetName,
      },
    });

    this.stackName = props.stackName;
    this.template = props.template;
    this.capabilities = props.capabilities;
    this.parameterOverrides = props.parameterOverrides;
    this.noExecuteChangeset = props.noExecuteChangeset;
    this.noDeleteFailedChangeset = props.noDeleteFailedChangeset;
    this.noFailOnEmptyChangeset = props.noFailOnEmptyChangeset;
    this.disableRollback = props.disableRollback;
    this.timeoutInMinutes = props.timeoutInMinutes;
    this.notificationArns = props.notificationArns;
    this.roleArn = props.roleArn;
    this.tags = props.tags;
    this.terminationProtection = props.terminationProtection;
    this.httpProxy = props.httpProxy;
    this.changeSetName = props.changeSetName;
    this.version = props.version;
  }

  /**
   * Retrieves outputs of the CloudFormation Deploy action.
   *
   * @returns `AwsCloudFormationGitHubDeployV1Outputs` with the `stackId` and additional stack outputs.
   */
  public get outputs(): AwsCloudFormationGitHubDeployV1Outputs {
    return {
      stackId: `\${{ steps.${this.id}.outputs.stack-id }}`,
    };
  }
}

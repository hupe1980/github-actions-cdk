import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

/**
 * Output structure for the DockerLogin action.
 *
 * @remarks
 * This interface defines specific outputs provided by the DockerLogin action,
 * such as an output indicating the login success status.
 */
export interface DockerLoginV3Outputs {
  /**
   * Status of the login process.
   */
  readonly loginStatus: string;
}

/**
 * Configuration properties for the DockerLogin action in a GitHub Actions workflow.
 *
 * @remarks
 * `DockerLoginV3Props` defines the various options available for the DockerLogin action,
 * including registry, username, password, ECR support, and logout behavior.
 */
export interface DockerLoginV3Props extends CommonActionProps {
  /**
   * Server address of Docker registry. Defaults to Docker Hub if not provided.
   *
   * @default Docker Hub
   */
  readonly registry?: string;

  /**
   * Username for Docker registry login.
   *
   * Required for authenticated Docker registries.
   */
  readonly username?: string;

  /**
   * Password or token for Docker registry login.
   *
   * Required for authenticated Docker registries.
   */
  readonly password?: string;

  /**
   * Specifies if the registry is Amazon ECR.
   *
   * Options:
   * - "auto": Automatically detects if the registry is ECR.
   * - "true": Forces ECR login behavior.
   * - "false": Disables ECR-specific logic.
   *
   * @default "auto"
   */
  readonly ecr?: "auto" | "true" | "false";

  /**
   * Determines if the Docker registry should be logged out at the end of the job.
   *
   * @default true
   */
  readonly logout?: boolean;

  /**
   * Specifies the version of the action to use.
   */
  readonly version?: string;
}

/**
 * DockerLoginV3 action for GitHub Actions workflows, allowing login to Docker registries.
 *
 * @remarks
 * This class provides configuration for the DockerLogin action, supporting
 * registry address, credentials, ECR options, and logout settings.
 */
export class DockerLoginV3 extends Action {
  public static readonly IDENTIFIER = "docker/login-action";

  public readonly registry?: string;
  public readonly username?: string;
  public readonly password?: string;
  public readonly ecr?: "auto" | "true" | "false";
  public readonly logout?: boolean;

  /**
   * Initializes a new instance of the DockerLogin action.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for the Docker login action behavior.
   */
  constructor(scope: IConstruct, id: string, props: DockerLoginV3Props) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: DockerLoginV3.IDENTIFIER,
      version: props.version ?? "v3",
      parameters: {
        registry: props.registry,
        username: props.username,
        password: props.password,
        ecr: props.ecr ?? "auto",
        logout: props.logout ?? true,
      },
    });

    this.registry = props.registry;
    this.username = props.username;
    this.password = props.password;
    this.ecr = props.ecr;
    this.logout = props.logout;
  }

  /**
   * Retrieves outputs of the DockerLogin action.
   *
   * @returns `DockerLoginV3Outputs` containing `loginStatus` to indicate login status.
   */
  public get outputs(): DockerLoginV3Outputs {
    return {
      loginStatus: `\${{ steps.${this.id}.outputs.login-status }}`,
    };
  }
}

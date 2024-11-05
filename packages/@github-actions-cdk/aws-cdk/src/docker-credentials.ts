import { Expression, type Job, type RegularStep, actions } from "github-actions-cdk";

/**
 * Base class for providing Docker credentials to various registry types.
 *
 * @remarks
 * The `DockerCredentials` class provides a unified interface for handling Docker login credentials
 * across different registry providers (e.g., DockerHub, ECR, GHCR). Concrete implementations of
 * this class define specific registry login steps.
 */
export abstract class DockerCredentials {
  /**
   * Creates a `DockerCredentials` instance for DockerHub.
   *
   * @param props - The properties for configuring DockerHub credentials.
   * @returns An instance of `DockerHubCredentials` configured with the specified properties.
   */
  public static dockerHub(props: DockerHubCredentialsProps): DockerCredentials {
    return new DockerHubCredentials(props);
  }

  /**
   * Creates a `DockerCredentials` instance for AWS ECR.
   *
   * @param props - The properties for configuring ECR credentials.
   * @returns An instance of `EcrCredentials` configured with the specified properties.
   */
  public static ecr(props: EcrCredentialsProps): DockerCredentials {
    return new EcrCredentials(props);
  }

  /**
   * Creates a `DockerCredentials` instance for GitHub Container Registry (GHCR).
   *
   * @returns An instance of `GhcrCredentials`.
   */
  public static ghcr(): DockerCredentials {
    return new GhcrCredentials();
  }

  /**
   * Creates a `DockerCredentials` instance for a custom Docker registry.
   *
   * @param props - The properties for configuring custom registry credentials.
   * @returns An instance of `CustomProvider` configured with the specified properties.
   */
  public static customRegistry(props: CustomProviderProps): DockerCredentials {
    return new CustomProvider(props);
  }

  /**
   * Returns Docker login steps required for the specified job.
   *
   * @param job - The GitHub Actions job for which Docker login steps are generated.
   * @returns An array of `RegularStep` instances for Docker authentication.
   */
  public abstract credentialSteps(job: Job): RegularStep[];
}

/**
 * Properties required for DockerHub credentials.
 *
 * @remarks
 * These properties allow for configuration of DockerHub login credentials, typically provided
 * as environment variables or secrets within the GitHub Actions workflow.
 */
export interface DockerHubCredentialsProps {
  /** Environment variable key for the DockerHub username. Defaults to "DOCKERHUB_USERNAME". */
  readonly usernameKey?: string;

  /** Environment variable key for the DockerHub access token. Defaults to "DOCKERHUB_TOKEN". */
  readonly personalAccessTokenKey?: string;
}

/**
 * DockerHub credentials class for authentication against DockerHub.
 *
 * @remarks
 * Uses specified or default environment variable keys to access DockerHub credentials
 * for authenticating within GitHub Actions.
 */
class DockerHubCredentials extends DockerCredentials {
  private readonly usernameKey: string;
  private readonly personalAccessTokenKey: string;

  constructor(props: DockerHubCredentialsProps) {
    super();
    this.usernameKey = props.usernameKey ?? "DOCKERHUB_USERNAME";
    this.personalAccessTokenKey = props.personalAccessTokenKey ?? "DOCKERHUB_TOKEN";
  }

  /**
   * Generates DockerHub login steps for the provided job.
   *
   * @param job - The job in which DockerHub login steps will be executed.
   * @returns A `RegularStep` array containing the DockerHub login command.
   */
  public credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "docker-hub-login", {
        username: Expression.fromSecrets(this.usernameKey),
        password: Expression.fromSecrets(this.personalAccessTokenKey),
      }),
    ];
  }
}

/**
 * Properties required for AWS ECR credentials.
 *
 * @remarks
 * Used to configure ECR credentials for authenticating against an AWS Elastic Container Registry.
 */
export interface EcrCredentialsProps {
  /** The ECR registry URL, required for connecting to a specific AWS ECR instance. */
  readonly registry: string;
}

/**
 * AWS ECR credentials class for authentication against AWS Elastic Container Registry.
 *
 * @remarks
 * Configures Docker login to AWS ECR using the specified registry URL.
 */
class EcrCredentials extends DockerCredentials {
  private readonly registry: string;

  constructor(props: EcrCredentialsProps) {
    super();
    this.registry = props.registry;
  }

  /**
   * Generates ECR login steps for the provided job.
   *
   * @param job - The job in which ECR login steps will be executed.
   * @returns A `RegularStep` array containing the ECR login command.
   */
  public credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "ecr-login", {
        registry: this.registry,
        ecr: "true",
      }),
    ];
  }
}

/**
 * GHCR credentials class for authentication against GitHub Container Registry.
 *
 * @remarks
 * Uses GitHub Actions-provided secrets and tokens for authenticating to GHCR.
 */
class GhcrCredentials extends DockerCredentials {
  /**
   * Generates GHCR login steps for the provided job.
   *
   * @param job - The job in which GHCR login steps will be executed.
   * @returns A `RegularStep` array containing the GHCR login command.
   */
  public credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "ghcr-login", {
        registry: "ghcr.io",
        username: Expression.fromGitHub("actor"),
        password: Expression.fromSecrets("GITHUB_TOKEN"),
      }),
    ];
  }
}

/**
 * Properties required for a custom Docker registry.
 *
 * @remarks
 * Configures the necessary properties for authenticating to a non-standard or third-party Docker registry.
 */
export interface CustomProviderProps {
  /** The registry URL. */
  readonly registry: string;

  /** Environment variable key for the registry username. */
  readonly usernameKey: string;

  /** Environment variable key for the registry password. */
  readonly passwordKey: string;
}

/**
 * Custom provider credentials class for authentication against a custom Docker registry.
 *
 * @remarks
 * Utilizes specified environment variable keys for the username and password to authenticate
 * against a custom Docker registry.
 */
class CustomProvider extends DockerCredentials {
  private readonly registry: string;
  private readonly usernameKey: string;
  private readonly passwordKey: string;

  constructor(props: CustomProviderProps) {
    super();
    this.registry = props.registry;
    this.usernameKey = props.usernameKey;
    this.passwordKey = props.passwordKey;
  }

  /**
   * Generates login steps for a custom Docker registry for the provided job.
   *
   * @param job - The job in which the custom registry login steps will be executed.
   * @returns A `RegularStep` array containing the custom registry login command.
   */
  public credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "custom-docker-login", {
        registry: this.registry,
        username: Expression.fromSecrets(this.usernameKey),
        password: Expression.fromSecrets(this.passwordKey),
      }),
    ];
  }
}

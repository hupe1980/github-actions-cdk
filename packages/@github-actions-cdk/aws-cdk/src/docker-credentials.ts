import { Expression, type Job, type RegularStep, actions } from "github-actions-cdk";
import { PublishPipelineJob, SynthPipelineJob } from "./jobs";

/**
 * Enumeration of Docker credential usage scenarios within a pipeline.
 *
 * @remarks
 * `DockerCredentialsUsage` defines where Docker credentials are required,
 * including the `SYNTH` phase for build/synth steps and `ASSET_PUBLISHING` for publishing assets.
 */
export enum DockerCredentialsUsage {
  /** Credentials used for synthesis and build steps. */
  SYNTH = "SYNTH",

  /** Credentials used for publishing assets (e.g., Docker images). */
  ASSET_PUBLISHING = "ASSET_PUBLISHING",
}

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
   * Factory method for DockerHub credentials.
   */
  public static dockerHub(props: DockerHubCredentialsProps): DockerCredentials {
    return new DockerHubCredentials(props);
  }

  /**
   * Factory method for AWS ECR credentials.
   */
  public static ecr(props: EcrCredentialsProps): DockerCredentials {
    return new EcrCredentials(props);
  }

  /**
   * Factory method for GitHub Container Registry (GHCR) credentials.
   */
  public static ghcr(props: GhcrCredentialsProps = {}): DockerCredentials {
    return new GhcrCredentials(props);
  }

  /**
   * Factory method for custom registry credentials.
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
  public credentialSteps(job: Job): RegularStep[] {
    if (this.usages) {
      if (job instanceof SynthPipelineJob && !this.usages.includes(DockerCredentialsUsage.SYNTH)) {
        return [];
      }

      if (
        job instanceof PublishPipelineJob &&
        !this.usages.includes(DockerCredentialsUsage.ASSET_PUBLISHING)
      ) {
        return [];
      }
    }

    return this._credentialSteps(job);
  }

  /**
   * @internal
   * Abstract method for registry-specific login steps.
   *
   * @remarks
   * Concrete implementations should define this method to return
   * the specific steps required for logging into the registry.
   */
  protected abstract _credentialSteps(job: Job): RegularStep[];

  /**
   * Initializes Docker credentials with specified usage scopes.
   *
   * @param usages - The usage scopes for the credentials (optional).
   */
  constructor(protected readonly usages?: DockerCredentialsUsage[]) {}
}

/**
 * Properties required for DockerHub credentials.
 */
export interface DockerHubCredentialsProps {
  /** Environment variable key for the DockerHub username. Defaults to "DOCKERHUB_USERNAME". */
  readonly usernameKey?: string;

  /** Environment variable key for the DockerHub access token. Defaults to "DOCKERHUB_TOKEN". */
  readonly personalAccessTokenKey?: string;

  /** Usage scopes for the credentials. */
  readonly usages?: DockerCredentialsUsage[];
}

/**
 * DockerHub credentials class for authentication against DockerHub.
 */
class DockerHubCredentials extends DockerCredentials {
  private readonly usernameKey: string;
  private readonly personalAccessTokenKey: string;

  constructor(props: DockerHubCredentialsProps) {
    super(props.usages);
    this.usernameKey = props.usernameKey ?? "DOCKERHUB_USERNAME";
    this.personalAccessTokenKey = props.personalAccessTokenKey ?? "DOCKERHUB_TOKEN";
  }

  /** @internal */
  protected _credentialSteps(job: Job): RegularStep[] {
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
 */
export interface EcrCredentialsProps {
  /** The ECR registry URL. */
  readonly registry: string;

  /** Usage scopes for the credentials. */
  readonly usages?: DockerCredentialsUsage[];
}

/**
 * AWS ECR credentials class for authentication against AWS Elastic Container Registry.
 */
class EcrCredentials extends DockerCredentials {
  private readonly registry: string;
  readonly usernameKey?: string;
  readonly personalAccessTokenKey?: string;

  constructor(props: EcrCredentialsProps) {
    super(props.usages);
    this.registry = props.registry;
  }

  /** @internal */
  protected _credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "ecr-login", {
        registry: this.registry,
        ecr: "true",
      }),
    ];
  }
}

/**
 * Properties required for GitHub Container Registry (GHCR) credentials.
 */
export interface GhcrCredentialsProps {
  /** Usage scopes for the credentials. */
  readonly usages?: DockerCredentialsUsage[];
}

/**
 * GHCR credentials class for authentication against GitHub Container Registry.
 */
class GhcrCredentials extends DockerCredentials {
  constructor(props: GhcrCredentialsProps = {}) {
    super(props.usages);
  }

  /** @internal */
  protected _credentialSteps(job: Job): RegularStep[] {
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
 */
export interface CustomProviderProps {
  /** The registry URL. */
  readonly registry: string;

  /** Environment variable key for the registry username. */
  readonly usernameKey: string;

  /** Environment variable key for the registry password. */
  readonly passwordKey: string;

  /** Usage scopes for the credentials. */
  readonly usages?: DockerCredentialsUsage[];
}

/**
 * Custom provider credentials class for authentication against a custom Docker registry.
 */
class CustomProvider extends DockerCredentials {
  readonly registry: string;
  private readonly usernameKey: string;
  private readonly passwordKey: string;

  constructor(props: CustomProviderProps) {
    super(props.usages);
    this.registry = props.registry;
    this.usernameKey = props.usernameKey;
    this.passwordKey = props.passwordKey;
  }

  /** @internal */
  protected _credentialSteps(job: Job): RegularStep[] {
    return [
      new actions.DockerLoginV3(job, "custom-docker-login", {
        registry: this.registry,
        username: Expression.fromSecrets(this.usernameKey),
        password: Expression.fromSecrets(this.passwordKey),
      }),
    ];
  }
}

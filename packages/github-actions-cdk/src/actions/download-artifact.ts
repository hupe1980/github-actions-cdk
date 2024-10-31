import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

/**
 * Output structure for the Download action.
 *
 * @remarks
 * This interface defines the specific output provided by the Download action,
 * including the `downloadPath` property which indicates where the artifact was downloaded.
 */
export interface DownloadArtifactV4Outputs {
  /**
   * Path where the artifact was downloaded.
   */
  readonly downloadPath: string;
}

/**
 * Configuration properties for the Download action in a GitHub Actions workflow.
 *
 * @remarks
 * `DownloadArtifactProps` defines the various options available for the Download action,
 * including artifact naming, paths, patterns, and authentication settings.
 */
export interface DownloadArtifactV4Props extends CommonActionProps {
  /**
   * Name of the artifact to download. If unspecified, all artifacts for the run are downloaded.
   */
  readonly artifactName?: string;

  /**
   * Destination path for the downloaded artifact. Defaults to `$GITHUB_WORKSPACE`.
   */
  readonly path?: string;

  /**
   * A glob pattern to match artifacts to download. Ignored if `name` is specified.
   */
  readonly pattern?: string;

  /**
   * Determines whether multiple matched artifacts are merged into the same directory.
   *
   * @default "false"
   */
  readonly mergeMultiple?: boolean;

  /**
   * GitHub token for authenticating with the GitHub API when downloading from a different repository or workflow.
   */
  readonly githubToken?: string;

  /**
   * Repository from which to download artifacts, specified as `owner/repo`.
   *
   * @default "${{ github.repository }}"
   */
  readonly repository?: string;

  /**
   * Workflow run ID from which artifacts are downloaded. Relevant if `githubToken` is provided.
   *
   * @default "${{ github.run_id }}"
   */
  readonly runId?: string;

  /**
   * Specifies the version of the action to use.
   *
   * @default "v4"
   */
  readonly version?: string;
}

/**
 * Download action for GitHub Actions workflows, configuring a download of build artifacts.
 *
 * @remarks
 * This class allows configuration of the Download action with options for specifying
 * the artifact name, download path, pattern matching, and GitHub API authentication.
 */
export class DownloadArtifactV4 extends Action {
  public readonly artifactName?: string;
  public readonly path?: string;
  public readonly pattern?: string;
  public readonly mergeMultiple?: boolean;
  public readonly githubToken?: string;
  public readonly repository?: string;
  public readonly runId?: string;

  /**
   * Initializes a new instance of the Download action.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for download action behavior.
   */
  constructor(scope: IConstruct, id: string, props: DownloadArtifactV4Props = {}) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: "actions/download-artifact",
      version: props.version ?? "v4",
      parameters: {
        name: props.artifactName,
        path: props.path,
        pattern: props.pattern,
        "merge-multiple": props.mergeMultiple,
        "github-token": props.githubToken,
        repository: props.repository,
        "run-id": props.runId,
      },
    });

    this.artifactName = props.artifactName;
    this.path = props.path;
    this.pattern = props.pattern;
    this.mergeMultiple = props.mergeMultiple;
    this.githubToken = props.githubToken;
    this.repository = props.repository;
    this.runId = props.runId;
  }

  /**
   * Retrieves outputs of the Download action.
   *
   * @returns `DownloadArtifactV4Outputs` containing `downloadPath` for further use.
   */
  public get outputs(): DownloadArtifactV4Outputs {
    return {
      downloadPath: `\${{ steps.${this.id}.outputs.download-path }}`,
    };
  }
}

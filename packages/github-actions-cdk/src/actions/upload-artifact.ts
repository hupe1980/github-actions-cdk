import type { IConstruct } from "constructs";
import { Action, type CommonActionProps } from "../action";

/**
 * Output structure for the Upload action.
 *
 * @remarks
 * This interface defines specific outputs provided by the Upload action,
 * including the `artifactId` and `artifactUrl` properties, which allow for
 * retrieval of the artifact's identifier and URL.
 */
export interface UploadArtifactV4Outputs {
  /**
   * Unique identifier for the uploaded artifact.
   */
  readonly artifactId: string;

  /**
   * Download URL for the uploaded artifact.
   */
  readonly artifactUrl: string;
}

/**
 * Configuration properties for the Upload action in a GitHub Actions workflow.
 *
 * @remarks
 * `UploadArtifactProps` defines the various options available for the Upload action,
 * including artifact naming, paths, retention, and compression settings.
 */
export interface UploadArtifactV4Props extends CommonActionProps {
  /**
   * Name of the artifact to upload.
   *
   * @default "artifact"
   */
  readonly artifactName?: string;

  /**
   * The path or pattern describing files to upload.
   */
  readonly path: string;

  /**
   * Behavior when no files match the provided path.
   *
   * Options:
   * - "warn": Output a warning but do not fail the action.
   * - "error": Fail the action with an error message.
   * - "ignore": Do not output warnings or errors.
   *
   * @default "warn"
   */
  readonly ifNoFilesFound?: "warn" | "error" | "ignore";

  /**
   * Days after which the artifact will expire.
   *
   * @remarks
   * 0 uses the repository default. Minimum 1 day, maximum 90 days.
   */
  readonly retentionDays?: number;

  /**
   * Compression level for artifact archiving, from 0 (no compression) to 9 (best compression).
   *
   * @default 6
   */
  readonly compressionLevel?: number;

  /**
   * If true, deletes an existing artifact with the same name before uploading.
   *
   * @default false
   */
  readonly overwrite?: boolean;

  /**
   * If true, includes hidden files in the artifact.
   *
   * @default false
   */
  readonly includeHiddenFiles?: boolean;

  /**
   * Specifies the version of the action to use.
   */
  readonly version?: string;
}

/**
 * Upload action for GitHub Actions workflows, uploading a build artifact for use in later steps.
 *
 * @remarks
 * This class allows configuration of the Upload action, supporting
 * additional parameters for naming, paths, and artifact retention.
 */
export class UploadArtifactV4 extends Action {
  public static readonly IDENTIFIER = "actions/upload-artifact";

  public readonly artifactName?: string;
  public readonly path: string;
  public readonly ifNoFilesFound?: "warn" | "error" | "ignore";
  public readonly retentionDays?: number;
  public readonly compressionLevel?: number;
  public readonly overwrite?: boolean;
  public readonly includeHiddenFiles?: boolean;

  /**
   * Initializes a new instance of the Upload action.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - Unique identifier for the action.
   * @param props - Configuration properties for upload action behavior.
   */
  constructor(scope: IConstruct, id: string, props: UploadArtifactV4Props) {
    super(scope, id, {
      name: props.name,
      actionIdentifier: UploadArtifactV4.IDENTIFIER,
      version: "v4",
      parameters: {
        name: props.artifactName,
        path: props.path,
        "if-no-files-found": props.ifNoFilesFound,
        "retention-days": props.retentionDays,
        "compression-level": props.compressionLevel,
        overwrite: props.overwrite,
        "include-hidden-files": props.includeHiddenFiles,
      },
    });

    this.artifactName = props.artifactName;
    this.path = props.path;
    this.ifNoFilesFound = props.ifNoFilesFound;
    this.retentionDays = props.retentionDays;
    this.compressionLevel = props.compressionLevel;
    this.overwrite = props.overwrite;
    this.includeHiddenFiles = props.includeHiddenFiles;
  }

  /**
   * Retrieves outputs of the Upload action.
   *
   * @returns `UploadArtifactV4Outputs` containing `artifactId` and `artifactUrl` for further use.
   */
  public get outputs(): UploadArtifactV4Outputs {
    return {
      artifactId: `\${{ steps.${this.id}.outputs.artifact-id }}`,
      artifactUrl: `\${{ steps.${this.id}.outputs.artifact-url }}`,
    };
  }
}

import * as path from "node:path";
import { type WorkflowAnnotation, isErrorAnnotation } from "./annotations";
import type { Workflow } from "./workflow";

/**
 * Represents the manifest information for a workflow.
 */
export interface WorkflowManifest {
  /**
   * Unique identifier for the workflow.
   */
  readonly id: string;

  /**
   * The construct path where the workflow is defined.
   */
  readonly constructPath: string;

  /**
   * The file path where the synthesized workflow YAML is saved.
   */
  readonly synthesizedWorkflowPath: string;

  /**
   * An array of annotations associated with the workflow.
   */
  readonly annotations: WorkflowAnnotation[];
}

/**
 * Represents the structure of the manifest, containing workflows and their version.
 */
export interface IManifest {
  /**
   * A record mapping workflow IDs to their respective manifest details.
   */
  readonly workflows: Record<string, WorkflowManifest>;

  /**
   * The version of the manifest format.
   */
  readonly version: string;
}

/**
 * Manages the creation of a manifest for synthesized workflows.
 *
 * The `Manifest` class maintains a record of workflows and provides methods
 * to generate a structured manifest output.
 */
export class Manifest implements IManifest {
  /**
   * A record mapping workflow IDs to their respective manifest details.
   */
  public readonly workflows: Record<string, WorkflowManifest> = {};

  /**
   * Initializes a new instance of the Manifest class.
   *
   * @param version - The version of the manifest format.
   * @param outdir - The output directory where the synthesized workflow YAML files are saved.
   */
  constructor(
    public readonly version: string,
    public readonly outdir: string,
  ) {}

  /**
   * Retrieves the manifest details for a specified workflow.
   *
   * If the workflow does not already exist in the manifest, it adds a new entry.
   *
   * @param workflow - The workflow instance for which the manifest is generated.
   * @returns The `WorkflowManifest` for the specified workflow.
   */
  public forWorkflow(workflow: Workflow): WorkflowManifest {
    const { id, path: constructPath } = workflow.node;

    if (!this.workflows[id]) {
      this.workflows[id] = {
        id,
        constructPath,
        synthesizedWorkflowPath: path.join(this.outdir, `${id}.yml`),
        annotations: [], // will be replaced later when processed in App
      };
    }

    return this.workflows[id];
  }

  public hasErrorAnnotation(): boolean {
    return Object.values(this.workflows).some((workflow) =>
      workflow.annotations.some(isErrorAnnotation),
    );
  }

  /**
   * Builds the complete manifest object for all workflows.
   *
   * @returns An object representing the manifest, including version and workflow details.
   */
  public buildManifest(): IManifest {
    return {
      version: this.version,
      workflows: this.workflows,
    };
  }
}

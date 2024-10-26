import * as path from "node:path";
import type { IConstruct } from "constructs";
import {
  type AnnotationMetadataEntryType,
  Annotations,
  type WorkflowAnnotation,
  isAnnotationMetadata,
  isErrorAnnotation,
} from "./annotations";
import { Aspects, type IAspect } from "./aspect";
import type { Manifest } from "./manifest";
import { YamlFile } from "./private/yaml";
import type { Workflow } from "./workflow";

/**
 * Represents the session for synthesizing workflows, including output directory and validation options.
 */
export interface ISynthesisSession {
  /**
   * The output directory where synthesized YAML files will be stored.
   */
  readonly outdir: string;

  /**
   * Indicates whether to skip validation during synthesis.
   *
   * @default false
   */
  readonly skipValidation?: boolean;

  /**
   * The manifest that records synthesized workflows.
   */
  readonly manifest: Manifest;
}

/**
 * Interface for synthesizers that handle workflow synthesis.
 */
export interface IWorkflowSynthesizer {
  /**
   * Synthesizes a workflow into the specified output format.
   *
   * @param session - The synthesis session containing configuration for the synthesis process.
   */
  synthesize(session: ISynthesisSession): void;
}

/**
 * Handles the synthesis of a GitHub Actions workflow, generating YAML output.
 */
export class WorkflowSynthesizer implements IWorkflowSynthesizer {
  /**
   * Creates a new instance of WorkflowSynthesizer.
   *
   * @param workflow - The workflow to be synthesized.
   * @param continueOnErrorAnnotations - Indicates whether to continue processing on error annotations.
   */
  constructor(
    protected workflow: Workflow,
    private continueOnErrorAnnotations = false,
  ) {}

  /**
   * Synthesizes the workflow into a YAML file.
   *
   * This process includes invoking aspects, validating the workflow,
   * checking annotations, and writing the output to a file.
   *
   * @param session - The synthesis session containing configuration for the synthesis process.
   */
  synthesize(session: ISynthesisSession): void {
    this.invokeAspects();

    if (!session.skipValidation) {
      this.validate();
    }

    const workflowManifest = session.manifest.forModel(this.workflow);
    const annotations = this.checkAnnotations();

    workflowManifest.annotations.push(...annotations);

    const filename = path.join(session.outdir, `${this.workflow.id}.yml`);
    new YamlFile(filename, this.workflow._toObject()).writeFile();
  }

  /**
   * Invokes all aspects associated with the workflow.
   */
  private invokeAspects(): void {
    invokeAspects(this.workflow);
  }

  /**
   * Validates the workflow, checking for any errors in the construct tree.
   *
   * @throws {Error} If validation errors are found.
   */
  private validate(): void {
    const errors = this.collectValidationErrors();
    if (errors.length > 0) {
      this.throwValidationError(errors);
    }
  }

  /**
   * Checks for annotations in the workflow and processes error annotations.
   *
   * @returns An array of workflow annotations.
   * @throws {Error} If there are error annotations and continuation is not allowed.
   */
  private checkAnnotations(): WorkflowAnnotation[] {
    const annotations = this.collectAnnotations();

    if (!this.continueOnErrorAnnotations && annotations.some(isErrorAnnotation)) {
      const errorMessages = annotations
        .filter(isErrorAnnotation)
        .map((a) => `[${a.constructPath}] ${a.message}`)
        .join("\n");
      throw new Error(`Encountered Annotations with level "ERROR":\n${errorMessages}`);
    }

    return annotations;
  }

  /**
   * Collects validation errors from the workflow's constructs.
   *
   * @returns An array of validation error messages along with their source constructs.
   */
  private collectValidationErrors(): { message: string; source: IConstruct }[] {
    return this.workflow.node
      .findAll()
      .flatMap((node) => node.node.validate().map((error) => ({ message: error, source: node })));
  }

  /**
   * Throws an error if validation fails, providing details of the errors.
   *
   * @param errors - The validation errors to report.
   * @throws {Error} With details of the validation failures.
   */
  private throwValidationError(errors: { message: string; source: IConstruct }[]): void {
    const errorList = errors.map((e) => `- [${e.source.node.path}]: ${e.message}`).join("\n\n  ");
    throw new Error(`Validation failed with the following errors:\n\n  ${errorList}\n`);
  }

  /**
   * Collects annotations from the workflow's constructs.
   *
   * @returns An array of workflow annotations.
   */
  private collectAnnotations(): WorkflowAnnotation[] {
    return this.workflow.node.findAll().flatMap((node) =>
      node.node.metadata.filter(isAnnotationMetadata).map((metadata) => ({
        constructPath: node.node.path,
        level: metadata.type as AnnotationMetadataEntryType,
        message: metadata.data,
        stacktrace: metadata.trace,
      })),
    );
  }
}

const invokedByPath: Record<string, IAspect[]> = {};

/**
 * Invokes aspects on a construct and its children, ensuring that aspects are applied correctly.
 *
 * @param root - The root construct for which aspects should be invoked.
 */
export function invokeAspects(root: IConstruct) {
  let nestedAspectWarning = false;
  recurse(root, []);

  function recurse(construct: IConstruct, inheritedAspects: IAspect[]) {
    const node = construct.node;
    const aspects = Aspects.of(construct);
    const allAspectsHere = [...inheritedAspects, ...aspects.all];
    const nodeAspectsCount = aspects.all.length;

    if (!invokedByPath[node.path]) {
      invokedByPath[node.path] = [];
    }

    const invoked = invokedByPath[node.path];

    for (const aspect of allAspectsHere) {
      if (!invoked.includes(aspect)) {
        aspect.visit(construct);

        if (!nestedAspectWarning && nodeAspectsCount !== aspects.all.length) {
          Annotations.of(construct).addWarning(
            "We detected an Aspect was added via another Aspect, and will not be applied",
          );
          nestedAspectWarning = true;
        }

        invoked.push(aspect);
      }
    }

    for (const child of construct.node.children) {
      recurse(child, allAspectsHere);
    }
  }
}

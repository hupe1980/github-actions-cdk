import * as path from "node:path";
import type { IConstruct } from "constructs";
import {
  type AnnotationMetadataEntryType,
  Annotations,
  type WorkflowAnnotation,
  isAnnotationMetadata,
} from "./annotations";
import { Aspects, type IAspect } from "./aspect";
import type { Manifest } from "./manifest";
import { YamlFile } from "./private/yaml";
import type { Workflow } from "./workflow";

const VALIDATION_ERROR_SYMBOL = Symbol("github-actions-cdk.ValidationError");

/**
 * Represents a validation error message with its source.
 */
export interface ValidationErrorMessage {
  /**
   * The message describing the validation error.
   */
  readonly message: string;

  /**
   * The source construct where the error originated.
   */
  readonly source: IConstruct;
}

/**
 * Creates a validation error with a specified message and associated errors.
 *
 * @param message - The error message describing the validation issue.
 * @param errors - An array of validation error messages with their sources.
 * @returns A new Error object with additional properties for validation errors.
 */
export function createValidationError(message: string, errors: ValidationErrorMessage[]): Error {
  const error = new Error(message);
  // @ts-ignore: Allowing dynamic property assignment
  error.errors = errors;
  // @ts-ignore: Allowing dynamic property assignment
  error[VALIDATION_ERROR_SYMBOL] = true;
  return error;
}

/**
 * Checks if the provided error is a validation error.
 *
 * @param error - The error to check.
 * @returns A boolean indicating whether the error is a validation error.
 */
export function isValidationError(
  error: unknown,
): error is Error & { errors: ValidationErrorMessage[] } {
  return (
    error instanceof Error &&
    (error as { [VALIDATION_ERROR_SYMBOL]?: boolean })[VALIDATION_ERROR_SYMBOL] === true
  );
}

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
   */
  constructor(protected workflow: Workflow) {}

  /**
   * Synthesizes the workflow into a YAML file.
   *
   * This process includes invoking aspects, validating the workflow,
   * checking annotations, and writing the output to a file.
   *
   * @param session - The synthesis session containing configuration for the synthesis process.
   * @throws {ValidationError} If validation errors are found.
   */
  synthesize(session: ISynthesisSession): void {
    this.invokeAspects();

    if (!session.skipValidation) {
      this.validate();
    }

    const workflowManifest = session.manifest.forWorkflow(this.workflow);

    const annotations = this.collectAnnotations();

    workflowManifest.annotations.push(...annotations);

    const filename = path.join(session.outdir, `${this.workflow.id}.yml`);

    const yaml = new YamlFile(filename, this.workflow._synth());

    yaml.writeFile();
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
   * @throws {ValidationError} If validation errors are found.
   */
  private validate(): void {
    const errors = this.collectValidationErrors();
    if (errors.length > 0) {
      const errorList = errors.map((e) => `- [${e.source.node.path}]: ${e.message}`).join("\n\n  ");
      throw createValidationError(
        `Validation failed with the following errors:\n\n  ${errorList}\n`,
        errors,
      );
    }
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

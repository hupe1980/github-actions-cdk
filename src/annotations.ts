import type { IConstruct, MetadataEntry } from "constructs";

/**
 * Enumeration of annotation metadata entry types.
 */
export enum AnnotationMetadataEntryType {
  INFO = "@github-actions-cdk/info",
  WARN = "@github-actions-cdk/warn",
  ERROR = "@github-actions-cdk/error",
}

/**
 * Constant to disable stack trace inclusion in metadata.
 */
export const DISABLE_STACK_TRACE_IN_METADATA =
  "@github-actions-cdk/disable_stack_trace_in_metadata";

/**
 * Manages annotations for a given construct scope, allowing
 * for structured logging of informational, warning, and error messages.
 */
export class Annotations {
  private readonly stackTraces: boolean;

  private constructor(private readonly scope: IConstruct) {
    this.stackTraces = !this.isStackTraceDisabled();
  }

  /**
   * Retrieves an instance of `Annotations` for the specified construct scope.
   *
   * @param scope The construct scope for which annotations will be managed.
   * @returns An instance of `Annotations` associated with the given scope.
   */
  public static of(scope: IConstruct): Annotations {
    return new Annotations(scope);
  }

  /**
   * Adds an informational message to the annotations.
   *
   * @param message The message to be logged as information.
   */
  public addInfo(message: string): void {
    this.addMessage(AnnotationMetadataEntryType.INFO, message);
  }

  /**
   * Adds a warning message to the annotations.
   *
   * @param message The message to be logged as a warning.
   */
  public addWarning(message: string): void {
    this.addMessage(AnnotationMetadataEntryType.WARN, message);
  }

  /**
   * Adds an error message to the annotations.
   *
   * @param message The message to be logged as an error.
   */
  public addError(message: string): void {
    this.addMessage(AnnotationMetadataEntryType.ERROR, message);
  }

  /**
   * Internal method to add a message of a specified severity level.
   *
   * @param level The severity level of the message (INFO, WARN, ERROR).
   * @param message The message content to log.
   */
  private addMessage(level: AnnotationMetadataEntryType, message: string): void {
    this.scope.node.addMetadata(level, message, {
      stackTrace: this.stackTraces,
    });
  }

  /**
   * Checks if stack traces should be disabled in metadata.
   *
   * @returns `true` if stack traces are disabled; otherwise, `false`.
   */
  private isStackTraceDisabled(): boolean {
    return this.scope.node.tryGetContext(DISABLE_STACK_TRACE_IN_METADATA) || false;
  }
}

/**
 * Represents an annotation for a workflow, capturing details about
 * the construct path, severity level, message, and optional stack trace.
 */
export interface WorkflowAnnotation {
  /**
   * The path of the construct in the tree.
   */
  readonly constructPath: string;

  /**
   * The severity level of the annotation (INFO, WARN, ERROR).
   */
  readonly level: AnnotationMetadataEntryType;

  /**
   * The message associated with the annotation.
   */
  readonly message: string;

  /**
   * Optional stack trace associated with the annotation, if applicable.
   */
  readonly stacktrace?: string[];
}

/**
 * Supported metadata types for annotations.
 */
const annotationMetadataEntryTypes = [
  AnnotationMetadataEntryType.INFO,
  AnnotationMetadataEntryType.WARN,
  AnnotationMetadataEntryType.ERROR,
] as string[];

/**
 * Determines if a metadata entry is an annotation.
 *
 * @param metadata - The metadata entry to check.
 * @returns `true` if the entry is an annotation; otherwise, `false`.
 */
export function isAnnotationMetadata(metadata: MetadataEntry): boolean {
  return annotationMetadataEntryTypes.includes(metadata.type);
}

/**
 * Checks if a given annotation represents an error level annotation.
 *
 * @param annotation - The annotation to evaluate.
 * @returns `true` if the annotation level is ERROR; otherwise, `false`.
 */
export function isErrorAnnotation(annotation: WorkflowAnnotation): boolean {
  return annotation.level === AnnotationMetadataEntryType.ERROR;
}

import { Annotations, Aspects } from "aws-cdk-lib";
import type { Construct, IConstruct } from "constructs";
import {
  AnnotationMetadataEntryType,
  Project,
  type ProjectProps,
  isValidationError,
} from "github-actions-cdk";

/**
 * The `AwsCdkAdapter` class integrates GitHub Actions workflows with AWS CDK constructs,
 * inheriting from the `Project` base class in `github-actions-cdk`.
 *
 * This adapter binds the lifecycle of a GitHub Actions workflow to an AWS CDK Construct,
 * allowing workflow creation, error handling, and annotation of errors and warnings
 * during the CDK synthesis process.
 */
export class AwsCdkAdapter extends Project {
  private readonly awsCdkScope: IConstruct;
  private hasValidationErrors: boolean;

  /**
   * Constructs a new `AwsCdkAdapter` instance.
   *
   * @param awsCdkScope - The AWS CDK construct scope associated with this adapter.
   * This scope is used as a base for adding validations, annotations, and managing synthesis errors.
   * @param props - Project properties for configuring GitHub Actions workflows.
   */
  constructor(awsCdkScope: Construct, props: ProjectProps = {}) {
    super(props);

    this.awsCdkScope = awsCdkScope;
    this.hasValidationErrors = false;

    // Add an aspect to automatically synthesize workflows within the CDK scope.
    Aspects.of(this.awsCdkScope).add({
      visit: (node: IConstruct) => {
        if (node === this.awsCdkScope) {
          this.synth();
        }
      },
    });
  }

  /**
   * Handles synthesis errors encountered during workflow generation.
   * If the error is a validation error, it registers the error message as a validation
   * message on the associated CDK scope.
   *
   * @param error - The error encountered during synthesis.
   * @throws Error - If the error is not a validation error, it will be re-thrown.
   */
  protected handleSynthesisError(error: unknown): void {
    if (isValidationError(error)) {
      this.hasValidationErrors = true;
      this.awsCdkScope.node.addValidation({
        validate: () => {
          return error.errors.map(({ message, source }) => `- [${source.node.path}]: ${message}`);
        },
      });
    } else {
      throw error;
    }
  }

  /**
   * Finalizes the synthesis process by transferring workflow annotations to
   * the CDK context as appropriate.
   *
   * This method checks each annotation's severity level (info, warning, error) and
   * adds it to the CDK scope using the `Annotations` utility.
   *
   * Additionally, this method stops synthesis if there are blocking errors,
   * unless overridden by `continueOnErrorAnnotations`.
   */
  protected finalizeSynthesis(): void {
    const workflows = Object.values(this.manifest.workflows);

    for (const workflow of workflows) {
      for (const annotation of workflow.annotations) {
        switch (annotation.level) {
          case AnnotationMetadataEntryType.INFO:
            Annotations.of(this.awsCdkScope).addInfo(annotation.message);
            break;
          case AnnotationMetadataEntryType.WARN:
            Annotations.of(this.awsCdkScope).addWarning(annotation.message);
            break;
          case AnnotationMetadataEntryType.ERROR:
            Annotations.of(this.awsCdkScope).addError(annotation.message);
            break;
          default:
            throw new Error(`Unknown annotation level: ${annotation.level}`);
        }
      }
    }

    // Halt synthesis if errors exist and should not be ignored.
    if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
      return;
    }

    // Halt synthesis if validation errors are present.
    if (this.hasValidationErrors) {
      return;
    }

    // Add informational message upon successful synthesis of workflows.
    Annotations.of(this.awsCdkScope).addInfo(
      `GitHub Actions workflows generated at ${this.outdir}`,
    );
  }
}

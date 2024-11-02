import { Annotations, Aspects } from "cdktf";
import type { Construct, IConstruct } from "constructs";
import {
  AnnotationMetadataEntryType,
  Project,
  type ProjectProps,
  isValidationError,
} from "github-actions-cdk";

/**
 * Adapter to integrate CDKTF (Cloud Development Kit for Terraform) projects with GitHub Actions.
 * This class extends the base `Project` class and allows for GitHub Actions workflow generation with annotation handling and validation.
 */
export class CdktfAdapter extends Project {
  private readonly awsCdkScope: IConstruct;
  private hasValidationErrors: boolean;

  /**
   * Initializes a new instance of the CdktfAdapter.
   *
   * @param awsCdkScope - The scope of the AWS CDK project.
   * @param props - Optional properties for project configuration.
   */
  constructor(awsCdkScope: Construct, props: ProjectProps = {}) {
    super(props);

    this.awsCdkScope = awsCdkScope;
    this.hasValidationErrors = false;

    // Add an aspect to trigger synthesis when visiting the root scope node.
    Aspects.of(this.awsCdkScope).add({
      visit: (node: IConstruct) => {
        if (node === this.awsCdkScope) {
          this.synth();
        }
      },
    });
  }

  /**
   * Handles errors occurring during the synthesis process, particularly validation errors.
   * Adds validation error messages as annotations to the CDK scope node.
   *
   * @param error - The error encountered during synthesis.
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
   * Finalizes the synthesis process by adding annotations based on workflow metadata.
   * Adds informational, warning, and error messages to the AWS CDK scope and handles whether synthesis should continue on error annotations.
   */
  protected finalizeSynthesis(): void {
    const workflows = Object.values(this.manifest.workflows);

    // Loop through all annotations in workflows and apply appropriate annotation levels.
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

    // If not configured to continue on errors and error annotations are present, halt synthesis.
    if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
      return;
    }

    // Halt synthesis if there are validation errors.
    if (this.hasValidationErrors) {
      return;
    }

    // Log successful workflow generation.
    Annotations.of(this.awsCdkScope).addInfo(
      `GitHub Actions workflows generated at ${this.outdir}`,
    );
  }
}

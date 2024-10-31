import { Annotations, Aspects } from "cdktf";
import type { Construct, IConstruct } from "constructs";
import {
  AnnotationMetadataEntryType,
  Project,
  type ProjectProps,
  isValidationError,
} from "github-actions-cdk";

export class CdktfAdapter extends Project {
  private readonly awsCdkScope: IConstruct;
  private hasValidationErrors: boolean;

  constructor(awsCdkScope: Construct, props: ProjectProps = {}) {
    super(props);

    this.awsCdkScope = awsCdkScope;
    this.hasValidationErrors = false;

    Aspects.of(this.awsCdkScope).add({
      visit: (node: IConstruct) => {
        if (node === this.awsCdkScope) {
          this.synth();
        }
      },
    });
  }

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

    if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
      return;
    }

    if (this.hasValidationErrors) {
      return;
    }

    Annotations.of(this.awsCdkScope).addInfo(
      `GitHub Actions workflows generated at ${this.outdir}`,
    );
  }
}

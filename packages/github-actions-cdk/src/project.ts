import { RootConstruct } from "constructs";
import { AnnotationMetadataEntryType } from "./annotations";
import { Aspects } from "./aspect";
import { ExternalActionVersionCheck } from "./checks";
import { type IManifest, Manifest } from "./manifest";
import { ensureDirSync, getPackageVersion } from "./private/utils";
import { type ISynthesisSession, isValidationError } from "./synthesizer";
import { Workflow, type WorkflowProps } from "./workflow";

/**
 * Configuration properties for setting up a `Project` instance.
 */
export interface ProjectProps {
  readonly outdir?: string;
  readonly skipValidation?: boolean;
  readonly additionalChecks?: boolean;
  readonly continueOnErrorAnnotations?: boolean;
}

/**
 * Represents a GitHub Actions project, managing workflows and their output.
 */
export class Project extends RootConstruct {
  public readonly outdir: string;
  public readonly skipValidation?: boolean;
  public readonly additionalChecks?: boolean;
  public readonly continueOnErrorAnnotations?: boolean;
  public readonly manifest: Manifest;

  constructor(props: ProjectProps = {}) {
    super();
    this.outdir = props.outdir ?? "./.github/workflows";
    this.skipValidation = props.skipValidation ?? false;
    this.additionalChecks = props.additionalChecks ?? false;
    this.continueOnErrorAnnotations = props.continueOnErrorAnnotations ?? false;
    this.manifest = new Manifest(getPackageVersion() ?? "0.0.0", this.outdir);
  }

  public addWorkflow(id: string, props: WorkflowProps): Workflow {
    return new Workflow(this, id, props);
  }

  /**
   * Main synthesis process that orchestrates the synthesis steps.
   */
  public synth(): void {
    this.prepareOutputDir();
    const session = this.createSynthesisSession();
    const workflows = this.node
      .findAll()
      .filter<Workflow>((c): c is Workflow => c instanceof Workflow);

    try {
      this.synthesizeWorkflows(workflows, session);
    } catch (error) {
      this.handleSynthesisError(error);
    }

    this.finalizeSynthesis();
  }

  /**
   * Ensures the output directory exists before synthesis.
   */
  protected prepareOutputDir(): void {
    ensureDirSync(this.outdir);
  }

  /**
   * Creates a synthesis session object.
   */
  protected createSynthesisSession(): ISynthesisSession {
    return {
      outdir: this.outdir,
      skipValidation: this.skipValidation,
      manifest: this.manifest,
    };
  }

  /**
   * Synthesizes each workflow and applies additional checks if configured.
   *
   * @param workflows - Array of workflows to synthesize.
   * @param session - Synthesis session information.
   */
  protected synthesizeWorkflows(workflows: Workflow[], session: ISynthesisSession): void {
    for (const workflow of workflows) {
      if (this.additionalChecks) {
        Aspects.of(workflow).add(new ExternalActionVersionCheck());
      }
      workflow.synthesizer.synthesize(session);
    }
  }

  /**
   * Handles any errors encountered during synthesis.
   */
  protected handleSynthesisError(error: unknown): void {
    if (isValidationError(error)) {
      console.error("❌ Validation failed with the following errors:");
      for (const { message, source } of error.errors) {
        console.error(`- [${source.node.path}]: ${message}`);
      }
      console.error("\nPlease address the validation issues above and try again.");
      throw new Error("Validation failed.");
    }

    throw error;
  }

  /**
   * Finalizes the synthesis process, printing annotations and handling error annotations.
   */
  protected finalizeSynthesis(): void {
    this.printManifestAnnotations(this.manifest);

    if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
      console.error("❌ Errors detected in workflows. Exiting with a non-zero code.");
      throw new Error("Error annotation.");
    }

    console.log("✅ Workflows synthesized successfully.");
  }

  /**
   * Prints annotations from a workflow manifest to the console.
   *
   * @param manifest - The `IManifest` object containing workflows and their annotations.
   */
  private printManifestAnnotations(manifest: IManifest, printStacktrace = false): void {
    console.log(`Manifest Version: ${manifest.version}`);
    const workflows = Object.values(manifest.workflows);

    if (workflows.length === 0) {
      console.log("No workflows found in the manifest.");
      return;
    }

    for (const workflow of workflows) {
      console.log(`\nWorkflow ID: ${workflow.id}`);
      console.log(`Construct Path: ${workflow.constructPath}`);
      console.log(`Synthesized Workflow Path: ${workflow.synthesizedWorkflowPath}`);

      if (workflow.annotations.length === 0) {
        console.log("No annotations for this workflow.");
      } else {
        console.log("Annotations:");
        workflow.annotations.forEach((annotation, index) => {
          console.log(
            `  ${index + 1}. ${this.formatAnnotationLevel(annotation.level)} - ${annotation.message}`,
          );
          if (annotation.stacktrace && printStacktrace) {
            console.log("    Stack trace:");
            // biome-ignore lint/complexity/noForEach: This is a simple loop to print the stack trace.
            annotation.stacktrace.forEach((line) => {
              console.log(`      ${line}`);
            });
          }
        });
      }
    }
  }

  /**
   * Formats annotation level with icons and descriptions.
   *
   * @param level - The annotation level (INFO, WARN, ERROR).
   * @returns A string with formatted label and icon for the annotation level.
   */
  private formatAnnotationLevel(level: AnnotationMetadataEntryType): string {
    switch (level) {
      case AnnotationMetadataEntryType.INFO:
        return "ℹ️ Info";
      case AnnotationMetadataEntryType.WARN:
        return "⚠️ Warning";
      case AnnotationMetadataEntryType.ERROR:
        return "❌ Error";
      default:
        return "Unknown Level";
    }
  }
}

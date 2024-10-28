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
  /**
   * Directory for generated workflow YAML files.
   *
   * Defines the target directory where GitHub Actions workflow YAML files
   * are outputted. Defaults to `./.github/workflows` if not specified.
   *
   * @default "./.github/workflows"
   */
  readonly outdir?: string;

  /**
   * Toggle for skipping validation during synthesis.
   *
   * When `true`, skips validation of workflows. Useful for cases where
   * validation can be safely ignored.
   *
   * @default false
   */
  readonly skipValidation?: boolean;

  /**
   * Flag to enable additional workflow checks.
   *
   * When `true`, additional checks, like the `ExternalActionVersionCheck`,
   * are applied to workflows.
   *
   * @default false
   */
  readonly additionalChecks?: boolean;

  /**
   * Continue synthesis despite error annotations.
   *
   * When `true`, workflows with errors will not stop the synthesis process.
   *
   * @default false
   */
  readonly continueOnErrorAnnotations?: boolean;
}

/**
 * Represents a GitHub Actions project, managing workflows and their output.
 *
 * `Project` enables defining and synthesizing GitHub Actions workflows, converting
 * them to YAML files in the specified output directory.
 */
export class Project extends RootConstruct {
  /**
   * Output directory for synthesized workflow YAML files.
   */
  public readonly outdir: string;

  /**
   * Flag to determine if validation is skipped during synthesis.
   */
  public readonly skipValidation?: boolean;

  /**
   * Flag indicating if additional checks are applied during synthesis.
   */
  public readonly additionalChecks?: boolean;

  /**
   * Flag to continue on error annotations, bypassing exit on errors.
   */
  public readonly continueOnErrorAnnotations?: boolean;

  /**
   * Manifest object storing synthesized workflows for this project.
   */
  public readonly manifest: Manifest;

  /**
   * Initializes a new `Project` instance.
   *
   * @param props - Configuration options, including output directory, validation, and error-handling behavior.
   */
  constructor(props: ProjectProps = {}) {
    super();

    this.outdir = props.outdir ?? "./.github/workflows";
    this.skipValidation = props.skipValidation ?? false;
    this.additionalChecks = props.additionalChecks ?? false;
    this.continueOnErrorAnnotations = props.continueOnErrorAnnotations ?? false;
    this.manifest = new Manifest(getPackageVersion() ?? "0.0.0", this.outdir);
  }

  /**
   * Adds a workflow to the project.
   *
   * Creates and registers a new GitHub Actions workflow for this project.
   *
   * @param id - Unique identifier for the workflow.
   * @param props - Configuration properties for the workflow.
   * @returns A new `Workflow` instance added to this project.
   */
  public addWorkflow(id: string, props: WorkflowProps): Workflow {
    return new Workflow(this, id, props);
  }

  /**
   * Synthesizes workflows into YAML files in the specified output directory.
   *
   * This method locates all workflow constructs in the project, serializes them to
   * YAML, and writes them to the output directory with a `.yml` extension.
   * It ensures the output directory exists and handles validation and error checks.
   */
  public synth(): void {
    // Ensure the output directory exists
    ensureDirSync(this.outdir);

    const session: ISynthesisSession = {
      outdir: this.outdir,
      skipValidation: this.skipValidation,
      manifest: this.manifest,
    };

    // Retrieve all workflows within the project
    const workflows = this.node
      .findAll()
      .filter<Workflow>((c): c is Workflow => c instanceof Workflow);

    try {
      // Synthesize each workflow and apply any additional checks
      for (const workflow of workflows) {
        if (this.additionalChecks) {
          Aspects.of(workflow).add(new ExternalActionVersionCheck());
        }
        workflow.synthesizer.synthesize(session);
      }
    } catch (error) {
      if (isValidationError(error)) {
        console.error("❌ Validation failed with the following errors:\n");
        for (const { message, source } of error.errors) {
          console.error(`- [${source.node.path}]: ${message}`);
        }
        console.error("\nPlease address the validation issues above and try again.");
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Print annotations and exit if errors are found and continueOnErrorAnnotations is false
    prettyPrintWorkflowManifestAnnotations(this.manifest);
    if (!this.continueOnErrorAnnotations && this.manifest.hasErrorAnnotation()) {
      console.error("❌ Errors detected in workflows. Exiting with a non-zero code.");
      process.exit(1);
    } else {
      console.log("✅ Workflows synthesized successfully.");
    }
  }
}

/**
 * Pretty-prints annotations from a workflow manifest.
 *
 * @param manifest - The `IManifest` object containing workflows and their annotations.
 */
export function prettyPrintWorkflowManifestAnnotations(
  manifest: IManifest,
  printStacktrace = false,
): void {
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
          `  ${index + 1}. ${formatAnnotationLevel(annotation.level)} - ${annotation.message}`,
        );
        if (annotation.stacktrace && printStacktrace) {
          console.log("    Stack trace:");
          for (const line of annotation.stacktrace) {
            console.log(`      ${line}`);
          }
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
function formatAnnotationLevel(level: AnnotationMetadataEntryType): string {
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

import { RootConstruct } from "constructs";
import { Manifest } from "./manifest";
import { ensureDirSync, getPackageVersion } from "./private/utils";
import { type ISynthesisSession, ValidationError } from "./synthesizer";
import { Workflow, type WorkflowProps } from "./workflow";

/**
 * Properties for configuring a Project instance.
 */
export interface ProjectProps {
  /**
   * Directory where the workflow YAML files will be generated.
   *
   * Specifies the target directory for outputting the YAML representation of the
   * project workflows. Defaults to `./.github/workflows` if no directory is specified.
   *
   * @default "./.github/workflows"
   */
  readonly outdir?: string;

  /**
   * Flag to skip validation during the synthesis process.
   *
   * If set to `true`, the validation of workflows will be bypassed. This can be useful
   * in scenarios where you want to synthesize workflows without enforcing validation rules.
   *
   * @default false
   */
  readonly skipValidation?: boolean;
}

/**
 * Represents a GitHub Actions project, managing workflows and their output.
 *
 * `Project` provides an interface to synthesize and output GitHub Actions
 * workflows as YAML files to a specified directory. Workflows added to the
 * project are discovered and converted into YAML format upon synthesis.
 */
export class Project extends RootConstruct {
  /**
   * The output directory where synthesized workflow models are saved.
   *
   * This directory is created if it does not exist, ensuring that all workflows
   * are saved in the correct location during synthesis.
   */
  public readonly outdir: string;

  /**
   * Flag to indicate whether to skip validation during synthesis.
   *
   * This flag determines if the validation of workflows is bypassed when
   * synthesizing the project.
   */
  public readonly skipValidation?: boolean;

  /**
   * The manifest that records the synthesized workflows for the project.
   */
  public readonly manifest: Manifest;

  /**
   * Initializes a new `Project` instance.
   *
   * @param props - Configuration options for the project, including the output directory and validation flag.
   */
  constructor(props: ProjectProps = {}) {
    super();

    this.outdir = props.outdir ?? "./.github/workflows";
    this.skipValidation = props.skipValidation;
    this.manifest = new Manifest(getPackageVersion() ?? "0.0.0", this.outdir);
  }

  /**
   * Adds a workflow to the project.
   *
   * This method allows for the creation of a new GitHub Actions workflow associated
   * with the project, setting it up with a specific name and properties.
   *
   * @param id - The identifier of the workflow, used to distinguish it from other workflows.
   * @param props - Workflow configuration properties, defining triggers, jobs, and more.
   * @returns A new `Workflow` instance bound to this project.
   */
  public addWorkflow(id: string, props: WorkflowProps): Workflow {
    return new Workflow(this, id, props);
  }

  /**
   * Synthesizes workflows into YAML files within the output directory.
   *
   * This method finds all workflow constructs within the project, serializes them to
   * YAML, and writes each one to the output directory with a `.yml` extension.
   * Each workflow file is named based on the `Workflow.name` property.
   *
   * It ensures that the output directory exists before synthesis begins.
   */
  public synth(): void {
    // Create the output directory if it does not already exist
    ensureDirSync(this.outdir);

    const session: ISynthesisSession = {
      outdir: this.outdir,
      skipValidation: this.skipValidation,
      manifest: this.manifest,
    };

    // Find all workflow constructs in the project and synthesize them
    const workflows = this.node
      .findAll()
      .filter<Workflow>((c): c is Workflow => c instanceof Workflow);

    try {
      for (const workflow of workflows) {
        workflow.synthesizer.synthesize(session);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        this.handleValidationError(error);
        process.exit(1); // Exit with a non-zero code
      } else {
        throw error; // Re-throw unexpected errors
      }
    }
  }

  /**
   * Handles pretty-printing of validation errors.
   *
   * @param error - The ValidationError to log.
   */
  private handleValidationError(error: ValidationError): void {
    console.error("❌ Validation failed with the following errors:\n");
    for (const { message, source } of error.errors) {
      console.error(`- [${source.node.path}]: ${message}`);
    }
    console.error("\nPlease address the validation issues above and try again.\n");
  }
}

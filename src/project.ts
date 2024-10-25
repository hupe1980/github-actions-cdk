import { RootConstruct } from "constructs";
import { ensureDirSync } from "./private/utils";
import { YamlFile } from "./private/yaml";
import { Workflow } from "./workflow";

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
	 * @default - "./.github/workflows"
	 */
	readonly outdir?: string;
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
	 * Initializes a new `Project` instance.
	 *
	 * @param props - Configuration options for the project, including the output directory.
	 */
	constructor(props: ProjectProps = {}) {
		super();
		this.outdir = props.outdir ?? "./.github/workflows";

		// Create the output directory if it does not already exist
		ensureDirSync(this.outdir);
	}

	/**
	 * Synthesizes workflows into YAML files within the output directory.
	 *
	 * Finds all workflow constructs within the project, serializes them to
	 * YAML, and writes each one to the output directory with a `.yml` extension.
	 * Each workflow file is named based on the `Workflow.name` property.
	 */
	public synth(): void {
		const workflows = this.node
			.findAll()
			.filter<Workflow>((c): c is Workflow => c instanceof Workflow);

		for (const workflow of workflows) {
			const filename = `${this.outdir}/${workflow.name}.yml`;
			const file = new YamlFile(filename, workflow._toObject());
			file.writeFile();
		}
	}
}
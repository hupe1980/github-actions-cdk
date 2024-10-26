import type { IConstruct } from "constructs";
import { Component } from "./component";
import { cleanObject } from "./private/utils";

/**
 * Properties for configuring an individual step in a GitHub Actions workflow job.
 */
export interface StepProps {
  /**
   * A descriptive name for the step, displayed in the GitHub Actions UI.
   *
   * @example "Install dependencies"
   */
  readonly name?: string;

  /**
   * Conditional expression to determine if the step should run.
   *
   * This can include GitHub Actions contexts and expressions, allowing
   * conditions like `${{ success() }}` or `${{ github.event_name == 'push' }}`.
   */
  readonly if?: string;

  /**
   * Specifies an action to run in this step.
   *
   * Defines a reusable action from the same repository, a public repository,
   * or a Docker container. Actions provide predefined functionality to avoid
   * custom scripting for common tasks.
   *
   * @example "actions/checkout@v2"
   */
  readonly uses?: string;

  /**
   * A shell command or script to run in this step.
   *
   * Runs specified command-line programs or scripts in the step's shell.
   * If `name` is not specified, this command's text will display as the step name.
   *
   * @example "npm install"
   */
  readonly run?: string[];

  /**
   * Input parameters for the action specified in `uses`.
   *
   * This is a key-value map of input parameters that the action can access
   * as environment variables, each prefixed with `INPUT_`.
   */
  readonly with?: Record<string, unknown>;

  /**
   * Environment variables available to this step.
   *
   * Step-specific environment variables are accessible within the shell
   * or action, overriding any workflow or job-level environment settings.
   */
  readonly env?: Record<string, string>;

  /**
   * Controls whether the job should continue if this step fails.
   *
   * Set to `true` to allow the job to proceed even if this step encounters an error.
   *
   * @default false
   */
  readonly continueOnError?: boolean;

  /**
   * Maximum execution time for the step, in minutes.
   *
   * After this time, the step is terminated to prevent indefinite execution.
   */
  readonly timeoutMinutes?: number;
}

/**
 * Represents a single step within a GitHub Actions job.
 *
 * A `Step` can run commands or actions and supports conditional execution,
 * environment variables, input parameters, and more.
 */
export class Step extends Component {
  public readonly name?: string;
  public readonly if?: string;
  public readonly uses?: string;
  public readonly run?: string[];
  public readonly with?: Record<string, unknown>;

  /**
   * Creates a new `Step` instance.
   *
   * @param scope - The scope in which to define this construct.
   * @param name - The identifier for this step.
   * @param props - Configuration properties for this step.
   * @throws Error if both `uses` and `run` are specified.
   */
  constructor(scope: IConstruct, name: string, props: StepProps) {
    super(scope, name);

    if (props.uses && props.run) {
      throw new Error("You cannot specify both uses and run in a step");
    }

    this.name = props.name;
    this.if = props.if;
    this.uses = props.uses;
    this.run = props.run;
    this.with = props.with;
  }

  /**
   * Gets the step's unique identifier.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Converts the step properties to an object for YAML serialization.
   *
   * Serializes the step's properties, cleaning out empty fields to avoid
   * unnecessary clutter in the generated YAML.
   *
   * @returns A record representing the step's configuration.
   */
  public _toObject(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      if: this.if,
      uses: this.uses,
      run: this.run?.join("\n"),
      with: cleanObject(this.with),
    };
  }
}

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
   * (corresponds to `if` in GitHub Actions)
   *
   * This can include GitHub Actions contexts and expressions, allowing
   * conditions like `${{ success() }}` or `${{ github.event_name == 'push' }}`.
   *
   * @example "${{ github.event_name == 'push' }}"
   */
  readonly condition?: string;

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
   * @example ["npm", "install"]
   */
  readonly run?: string[];

  /**
   * Input parameters for the action specified in `uses`.
   * (corresponds to `with` in GitHub Actions)
   *
   * This is a key-value map of input parameters that the action can access
   * as environment variables, each prefixed with `INPUT_`.
   *
   * @example { "token": "${{ secrets.GITHUB_TOKEN }}" }
   */
  readonly parameters?: Record<string, unknown>;

  /**
   * Environment variables available to this step.
   *
   * Step-specific environment variables are accessible within the shell
   * or action, overriding any workflow or job-level environment settings.
   *
   * @example { "NODE_ENV": "production" }
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
   *
   * @example 10
   */
  readonly timeoutMinutes?: number;

  /**
   * Specifies the working directory for the step.
   *
   * Sets the directory in which the step's command or action runs. If not specified,
   * it defaults to the job's working directory.
   *
   * @example "src/"
   */
  readonly workingDirectory?: string;

  /**
   * A shell specification to define the shell environment for this step.
   *
   * Allows specifying a shell other than the default, such as `bash`, `powershell`, etc.
   *
   * @default "bash"
   * @example "pwsh"
   */
  readonly shell?: "bash" | "sh" | "python" | "cmd" | "pwsh" | "powershell";
}

/**
 * Represents a single step within a GitHub Actions job.
 *
 * A `Step` can run commands or actions and supports conditional execution,
 * environment variables, input parameters, and more.
 */
export class Step extends Component {
  public readonly name?: string;
  public readonly condition?: string;
  public readonly uses?: string;
  public readonly run?: string[];
  public readonly parameters?: Record<string, unknown>;
  public readonly env?: Record<string, string>;
  public readonly continueOnError?: boolean;
  public readonly timeoutMinutes?: number;
  public readonly workingDirectory?: string;
  public readonly shell?: string;

  /**
   * Creates a new `Step` instance.
   *
   * @param scope - The scope in which to define this construct.
   * @param id - The identifier for this step.
   * @param props - Configuration properties for this step.
   * @throws Error if both `uses` and `run` are specified.
   */
  constructor(scope: IConstruct, id: string, props: StepProps) {
    super(scope, id);

    this.name = props.name;
    this.condition = props.condition; // previously `if`
    this.uses = props.uses;
    this.run = props.run;
    this.parameters = props.parameters; // previously `with`
    this.env = props.env;
    this.continueOnError = props.continueOnError;
    this.timeoutMinutes = props.timeoutMinutes;
    this.workingDirectory = props.workingDirectory;
    this.shell = props.shell;

    this.node.addValidation({
      validate: () => {
        const errors: string[] = [];

        if (this.uses && this.run) {
          errors.push(
            "Both 'uses' and 'run' cannot be specified in the same step. Please use either 'uses' to reference an action or 'run' to execute a command, but not both.",
          );
        }

        if (this.shell && !this.run) {
          errors.push(
            "The 'shell' property can only be specified when 'run' is defined. Please ensure you are using 'run' to execute a command before specifying the shell.",
          );
        }

        return errors;
      },
    });
  }

  /**
   * Gets the step's unique identifier.
   *
   * This identifier can be used to reference the step within the context of
   * a workflow job.
   *
   * @returns The unique identifier of the step.
   */
  public get id(): string {
    return this.node.id;
  }

  /**
   * Converts the step properties to an object for YAML serialization.
   *
   * Serializes the step's properties, cleaning out empty fields to avoid
   * unnecessary clutter in the generated YAML.
   *
   * @returns A record representing the step's configuration.
   * @internal
   */
  public _toObject(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      if: this.condition, // retain the original name for serialization
      uses: this.uses,
      run: this.run?.join("\n"),
      with: cleanObject(this.parameters), // retain the original name for serialization
      env: this.env,
      continueOnError: this.continueOnError,
      timeoutMinutes: this.timeoutMinutes,
      workingDirectory: this.workingDirectory,
      shell: this.shell,
    };
  }
}

import { validShells } from "./common";
import type { Job } from "./job";
import * as rules from "./rules";
import type { RegularStep, RunStep, StepBase } from "./step";
import type { Workflow } from "./workflow";

/**
 * Base class for all validators.
 * This class provides common functionality for error management
 * and validation processes.
 */
export abstract class Validator {
  private _errors: string[] = [];

  /**
   * Validates the current instance. This method should be implemented
   * by subclasses to perform specific validations.
   */
  public abstract validate(): void;

  /**
   * Gets the list of validation errors collected during validation.
   */
  public get errors(): string[] {
    return this._errors;
  }

  /**
   * Adds multiple error messages to the validator's error list.
   *
   * @param errors - An array of error messages to be added.
   */
  protected addErrors(errors: string[]): void {
    for (const error of errors) {
      this._errors.push(error);
    }
  }

  /**
   * Checks if a required property is set. If not, adds an error message
   * to the error list.
   *
   * @param property - The property to check.
   * @param name - The name of the property for the error message.
   */
  protected checkRequired(property: unknown, name: string): void {
    if (property === undefined || property === null) {
      this.addErrors([`${name} is required.`]);
    }
  }
}

/**
 * Validator for Workflow instances.
 * Validates properties specific to a workflow configuration.
 */
export class WorkflowValidator extends Validator {
  constructor(private readonly workflow: Workflow) {
    super();
  }

  /**
   * Validates the workflow's environment variables.
   */
  public validate(): void {
    if (this.workflow.env) this.addErrors(rules.validateEnvVars(this.workflow.env));
    if (this.workflow.defaults?.run?.shell)
      this.addErrors(rules.validateShellType(this.workflow.defaults.run.shell, validShells));
  }
}

/**
 * Validator for Job instances.
 * Validates properties specific to a job configuration within a workflow.
 */
export class JobValidator extends Validator {
  constructor(private readonly job: Job) {
    super();
  }

  /**
   * Validates the job's ID format, environment variables, and checks
   * if the job has steps defined.
   */
  public validate(): void {
    this.addErrors(rules.validateIdFormat(this.job.id));
    if (this.job.env) this.addErrors(rules.validateEnvVars(this.job.env));
    if (this.job.defaults?.run?.shell)
      this.addErrors(rules.validateShellType(this.job.defaults.run.shell, validShells));

    this.addErrors(rules.validateHasSteps(this.job));
  }
}

/**
 * Validator for StepBase instances.
 * Validates properties shared by all step types within a job.
 */
export class StepBaseValidator extends Validator {
  constructor(private readonly step: StepBase) {
    super();
  }

  /**
   * Validates the step's ID format and environment variables.
   */
  public validate(): void {
    this.addErrors(rules.validateIdFormat(this.step.id));
    if (this.step.env) {
      this.addErrors(rules.validateEnvVars(this.step.env));
    }
  }
}

/**
 * Validator for RunStep instances.
 * Validates properties specific to a run step, such as the shell type.
 */
export class RunStepValidator extends Validator {
  constructor(private readonly step: RunStep) {
    super();
  }

  /**
   * Validates the run step's properties.
   */
  public validate(): void {
    this.addErrors(rules.validateShellType(this.step.shell, validShells));
  }
}

/**
 * Validator for RegularStep instances.
 * Validates properties specific to a regular step.
 */
export class RegularStepValidator extends Validator {
  constructor(private readonly step: RegularStep) {
    super();
  }

  /**
   * Validates the regular step's properties.
   */
  public validate(): void {
    this.addErrors(rules.validateUsesFormat(this.step.uses));
  }
}

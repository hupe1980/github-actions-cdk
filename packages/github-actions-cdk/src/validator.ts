import type { IValidation } from "constructs";
import { validShells } from "./common";
import type { Job } from "./job";
import * as rules from "./rules";
import type { RegularStep, RunStep, StepBase } from "./step";
import type { Workflow } from "./workflow";

/**
 * Abstract base class for all validators.
 *
 * @remarks
 * The `Validator` class provides core error management and validation
 * methods, ensuring common validation operations across different
 * workflow constructs. Subclasses implement specific validations based
 * on construct types.
 */
export abstract class Validator implements IValidation {
  /**
   * Executes the validation logic for the instance.
   *
   * @returns An array of error messages if validation fails, or an empty array if successful.
   */
  public abstract validate(): string[];

  /**
   * Verifies that a required property is set.
   *
   * @param property - The property to check for presence.
   * @param name - The name of the property to include in error messages.
   * @returns An array containing an error message if the property is missing, or an empty array if it exists.
   */
  protected checkRequired(property: unknown, name: string): string[] {
    if (property === undefined || property === null) {
      return [`${name} is required.`];
    }
    return [];
  }
}

/**
 * Validator for `Workflow` instances.
 *
 * @remarks
 * Validates properties and configurations specific to workflows, such as
 * cron schedules, environment variables, and shell defaults.
 */
export class WorkflowValidator extends Validator {
  constructor(private readonly workflow: Workflow) {
    super();
  }

  /**
   * Validates various aspects of a workflow's configuration.
   *
   * @returns An array of error messages if validation fails.
   */
  public validate(): string[] {
    const errors: string[] = [];

    if (this.workflow.triggers.schedule) {
      errors.push(
        ...rules.validateCronExpression(
          this.workflow.triggers.schedule.map((v) => v.cron.toString()),
        ),
      );
    }
    if (this.workflow.env) errors.push(...rules.validateEnvVars(this.workflow.env));
    if (this.workflow.defaults?.run?.shell) {
      errors.push(...rules.validateShellType(this.workflow.defaults.run.shell, validShells));
    }

    return errors;
  }
}

/**
 * Validator for `Job` instances.
 *
 * @remarks
 * Validates properties of a job within a workflow, including its ID, environment variables, shell type,
 * and the presence of at least one step.
 */
export class JobValidator extends Validator {
  constructor(private readonly job: Job) {
    super();
  }

  /**
   * Validates the job's configuration, including ID, environment variables, shell type,
   * and the presence of steps.
   *
   * @returns An array of error messages if validation fails.
   */
  public validate(): string[] {
    const errors: string[] = [];

    errors.push(...rules.validateIdFormat(this.job.id));
    if (this.job.env) errors.push(...rules.validateEnvVars(this.job.env));
    if (this.job.defaults?.run?.shell) {
      errors.push(...rules.validateShellType(this.job.defaults.run.shell, validShells));
    }

    errors.push(...rules.validateHasSteps(this.job));

    return errors;
  }
}

/**
 * Validator for `StepBase` instances.
 *
 * @remarks
 * Validates properties common to all step types within a job, such as ID and environment variables.
 */
export class StepBaseValidator extends Validator {
  constructor(private readonly step: StepBase) {
    super();
  }

  /**
   * Validates common step properties, including ID format and environment variables.
   *
   * @returns An array of error messages if validation fails.
   */
  public validate(): string[] {
    const errors: string[] = [];

    errors.push(...rules.validateIdFormat(this.step.id));
    if (this.step.env) {
      errors.push(...rules.validateEnvVars(this.step.env));
    }

    return errors;
  }
}

/**
 * Validator for `RunStep` instances.
 *
 * @remarks
 * Validates properties specific to a run step, such as shell type, ensuring
 * compatibility with supported shells.
 */
export class RunStepValidator extends Validator {
  constructor(private readonly step: RunStep) {
    super();
  }

  /**
   * Validates properties specific to a run step, such as shell type.
   *
   * @returns An array of error messages if validation fails.
   */
  public validate(): string[] {
    const errors: string[] = [];

    errors.push(...rules.validateShellType(this.step.shell, validShells));

    return errors;
  }
}

/**
 * Validator for `RegularStep` instances.
 *
 * @remarks
 * Validates properties specific to a regular step, such as the "uses" format, ensuring it follows
 * the required format for GitHub Actions reusable workflows.
 */
export class RegularStepValidator extends Validator {
  constructor(private readonly step: RegularStep) {
    super();
  }

  /**
   * Validates properties specific to a regular step, such as the format of the `uses` property.
   *
   * @returns An array of error messages if validation fails.
   */
  public validate(): string[] {
    const errors: string[] = [];

    errors.push(...rules.validateUsesFormat(this.step.uses));

    return errors;
  }
}

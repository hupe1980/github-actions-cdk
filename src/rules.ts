import type { Job } from "./job";
import type { Workflow } from "./workflow";

/**
 * Validates the format of an identifier.
 *
 * @param id - The identifier to validate.
 * @returns An array of error messages if the identifier is invalid, otherwise an empty array.
 */
export function validateIdFormat(id: string): string[] {
  const errors: string[] = [];

  // Check if the identifier length is less than 100 characters
  if (id.length >= 100) {
    errors.push(`The identifier '${id}' is invalid. IDs must be less than 100 characters.`);
  }

  // Check if the identifier starts with a letter or '_' and contains valid characters
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(id)) {
    errors.push(
      `The identifier '${id}' is invalid. IDs may only contain alphanumeric characters, '_' and '-'. IDs must start with a letter or '_'.`,
    );
  }

  return errors;
}

/**
 * Validates environment variable names and values.
 *
 * @param env - An object representing environment variables, where keys are variable names and values are their corresponding values.
 * @returns An array of error messages if there are invalid variable names or values, otherwise an empty array.
 */
export function validateEnvVars(env: Record<string, string | undefined>): string[] {
  const errors: string[] = [];
  const envVarPattern = /^[A-Za-z_][A-Za-z0-9_-]{0,99}$/; // Regex for valid env variable names

  for (const [key, value] of Object.entries(env)) {
    // Check for valid key naming
    if (!envVarPattern.test(key)) {
      errors.push(
        `The identifier '${key}' is invalid. IDs may only contain alphanumeric characters, '_', and '-'. IDs must start with a letter or '_' and must be less than 100 characters.`,
      );
    }

    // Check for valid value (must be a non-empty string)
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`The value for '${key}' must be a non-empty string.`);
    }
  }

  return errors;
}

/**
 * Validates the shell type against a list of valid shells.
 *
 * @param shell - The shell type to validate.
 * @param validShells - An array of valid shell types.
 * @returns An array of error messages if the shell type is invalid, otherwise an empty array.
 */
export function validateShellType(
  shell: string | undefined,
  validShells: readonly string[],
): string[] {
  const errors: string[] = [];

  // Check if the provided shell is included in the list of valid shells
  if (shell && !validShells.includes(shell)) {
    errors.push(`'shell' must be one of the following: ${validShells.join(", ")}.`);
  }

  return errors;
}

/**
 * Validates the format of the 'uses' field in a RegularStepProps.
 *
 * @param uses - The 'uses' string to validate.
 * @returns An array of error messages if the format is invalid, otherwise an empty array.
 */
export function validateUsesFormat(uses: string): string[] {
  const errors: string[] = [];

  // Check length constraint
  if (uses.length >= 100) {
    errors.push(`The 'uses' field '${uses}' is invalid. It must be less than 100 characters.`);
  }

  // Regex patterns for validation
  const githubActionPattern =
    /^([a-zA-Z0-9-_]+)\/([a-zA-Z0-9-_]+)(\/([a-zA-Z0-9-_\/]+))?@([a-zA-Z0-9-_\.]+)/; // {owner}/{repo}@{ref} or {owner}/{repo}/{path}@{ref}
  const localPathPattern = /^\.\//; // Matches './' at the beginning of the string
  const dockerImagePattern = /^docker:\/\/([a-zA-Z0-9-_]+)(\/([a-zA-Z0-9-_]+))?:(.+)$/; // docker://{image}:{tag} or docker://{host}/{image}:{tag}

  // Check if it matches any of the valid patterns
  if (
    !githubActionPattern.test(uses) &&
    !localPathPattern.test(uses) &&
    !dockerImagePattern.test(uses)
  ) {
    errors.push(
      `The 'uses' field '${uses}' is invalid. It must match one of the valid formats: {owner}/{repo}@{ref}, {owner}/{repo}/{path}@{ref}, ./path/to/dir, docker://{image}:{tag}, or docker://{host}/{image}:{tag}.`,
    );
  }

  // Check for invalid characters in the uses string (only if it's not empty)
  if (uses && /[^\w\-\.\/:@]/.test(uses)) {
    errors.push(
      `The 'uses' field '${uses}' contains invalid characters. Only alphanumeric characters, '-', '_', '.', '/', ':', and '@' are allowed.`,
    );
  }

  return errors;
}

/**
 * Validates that a job contains at least one step.
 *
 * @param job - The job to validate.
 * @returns An array of error messages if the job has no steps, otherwise an empty array.
 */
export function validateHasSteps(job: Job): string[] {
  const errors: string[] = [];

  // Check if the job contains at least one valid step
  if (!job.hasSteps()) {
    errors.push("A job must contain at least one step.");
  }

  return errors;
}

/**
 * Validates that a workflow contains at least one job.
 *
 * @param workflow - The workflow to validate.
 * @returns An array of error messages if the workflow has no jobs, otherwise an empty array.
 */
export function validateHasJobs(workflow: Workflow): string[] {
  const errors: string[] = [];

  // Check if the workflow contains at least one valid job
  if (!workflow.hasJobs()) {
    errors.push("A workflow must contain at least one job.");
  }

  return errors;
}

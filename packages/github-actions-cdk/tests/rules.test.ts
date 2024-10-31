import { RootConstruct } from "constructs";
import {
  Job,
  Workflow,
  validateEnvVars,
  validateHasJobs,
  validateHasSteps,
  validateIdFormat,
  validateShellType,
  validateUsesFormat,
} from "../src";

describe("Validation Functions", () => {
  describe("validateIdFormat", () => {
    it("should return no errors for a valid ID", () => {
      expect(validateIdFormat("valid_id-123")).toEqual([]);
    });

    it("should return an error for an ID starting with a number", () => {
      expect(validateIdFormat("1invalid_id")).toEqual([
        "The identifier '1invalid_id' is invalid. IDs may only contain alphanumeric characters, '_' and '-'. IDs must start with a letter or '_'.",
      ]);
    });

    it("should return an error for an ID that is too long", () => {
      const tooLongId = "a".repeat(100);
      expect(validateIdFormat(tooLongId)).toEqual([
        `The identifier '${tooLongId}' is invalid. IDs must be less than 100 characters.`,
      ]);
    });

    it("should return an error for an ID containing invalid characters", () => {
      expect(validateIdFormat("invalid id!")).toEqual([
        "The identifier 'invalid id!' is invalid. IDs may only contain alphanumeric characters, '_' and '-'. IDs must start with a letter or '_'.",
      ]);
    });
  });

  describe("validateEnvVars", () => {
    it("should return no errors for valid environment variables", () => {
      const env = {
        VALID_VAR: "value",
        ANOTHER_VAR: "another_value",
      };
      expect(validateEnvVars(env)).toEqual([]);
    });

    it("should return an error for invalid environment variable names", () => {
      const env = {
        "1INVALID_VAR": "value",
        "INVALID_VAR!": "value",
      };
      expect(validateEnvVars(env)).toEqual([
        "The identifier '1INVALID_VAR' is invalid. IDs may only contain alphanumeric characters, '_', and '-'. IDs must start with a letter or '_' and must be less than 100 characters.",
        "The identifier 'INVALID_VAR!' is invalid. IDs may only contain alphanumeric characters, '_', and '-'. IDs must start with a letter or '_' and must be less than 100 characters.",
      ]);
    });

    it("should return an error for empty environment variable values", () => {
      const env = {
        VALID_VAR: "",
      };
      expect(validateEnvVars(env)).toEqual([
        "The value for 'VALID_VAR' must be a non-empty string.",
      ]);
    });
  });

  describe("validateShellType", () => {
    const validShells = ["bash", "sh", "python", "cmd", "pwsh", "powershell"];

    it("should return no errors for a valid shell type", () => {
      expect(validateShellType("bash", validShells)).toEqual([]);
    });

    it("should return an error for an invalid shell type", () => {
      expect(validateShellType("invalidShell", validShells)).toEqual([
        "'shell' must be one of the following: bash, sh, python, cmd, pwsh, powershell.",
      ]);
    });

    it("should return no errors when shell type is undefined", () => {
      expect(validateShellType(undefined, validShells)).toEqual([]);
    });
  });

  describe("validateUsesFormat", () => {
    it("should return no errors for a valid GitHub action", () => {
      const result = validateUsesFormat("octocat/Hello-World@main");
      expect(result).toEqual([]);
    });

    it("should return no errors for a valid action with path", () => {
      const result = validateUsesFormat("octocat/Hello-World/path/to/action@v1.0");
      expect(result).toEqual([]);
    });

    it("should return no errors for a valid local path", () => {
      const result = validateUsesFormat("./path/to/dir");
      expect(result).toEqual([]);
    });

    it("should return no errors for a valid Docker image", () => {
      const result = validateUsesFormat("docker://my-image:latest");
      expect(result).toEqual([]);
    });

    it("should return no errors for a valid Docker image with host", () => {
      const result = validateUsesFormat("docker://my-host/my-image:latest");
      expect(result).toEqual([]);
    });

    it("should return an error for an invalid uses format with invalid characters", () => {
      const result = validateUsesFormat("invalid/uses@ref!");
      expect(result).toEqual([
        "The 'uses' field 'invalid/uses@ref!' contains invalid characters. Only alphanumeric characters, '-', '_', '.', '/', ':', and '@' are allowed.",
      ]);
    });

    it("should return an error for missing owner and repo", () => {
      const result = validateUsesFormat("@main");
      expect(result).toEqual([
        "The 'uses' field '@main' is invalid. It must match one of the valid formats: {owner}/{repo}@{ref}, {owner}/{repo}/{path}@{ref}, ./path/to/dir, docker://{image}:{tag}, or docker://{host}/{image}:{tag}.",
      ]);
    });

    it("should return an error for a uses string with a missing reference", () => {
      const result = validateUsesFormat("octocat/Hello-World@");
      expect(result).toEqual([
        "The 'uses' field 'octocat/Hello-World@' is invalid. It must match one of the valid formats: {owner}/{repo}@{ref}, {owner}/{repo}/{path}@{ref}, ./path/to/dir, docker://{image}:{tag}, or docker://{host}/{image}:{tag}.",
      ]);
    });

    it("should return an error for a uses string with missing repo", () => {
      const result = validateUsesFormat("octocat/@main");
      expect(result).toEqual([
        "The 'uses' field 'octocat/@main' is invalid. It must match one of the valid formats: {owner}/{repo}@{ref}, {owner}/{repo}/{path}@{ref}, ./path/to/dir, docker://{image}:{tag}, or docker://{host}/{image}:{tag}.",
      ]);
    });
  });

  describe("validateHasSteps", () => {
    it("should return no errors for a job with steps", () => {
      const root = new RootConstruct();
      const mockJob = new Job(root, "valid_job_with_step");
      mockJob.addRunStep("step1", { run: "echo 'Hello, world!'" });
      expect(validateHasSteps(mockJob)).toEqual([]);
    });

    it("should return an error for a job without steps", () => {
      const root = new RootConstruct();
      const mockJob = new Job(root, "valid_job_without_step");
      expect(validateHasSteps(mockJob)).toEqual(["A job must contain at least one step."]);
    });
  });

  describe("validateHasJobs", () => {
    it("should return no errors for a workflow with jobs", () => {
      const root = new RootConstruct();
      const mockWorkflow = new Workflow(root, "valid_workflow_with_jobs");
      mockWorkflow.addJob("valid_job"); // Assuming you have a method to add jobs to the workflow
      expect(validateHasJobs(mockWorkflow)).toEqual([]);
    });

    it("should return an error for a workflow without jobs", () => {
      const root = new RootConstruct();
      const mockWorkflow = new Workflow(root, "valid_workflow_without_jobs");
      expect(validateHasJobs(mockWorkflow)).toEqual(["A workflow must contain at least one job."]);
    });
  });
});

// tests/step.test.ts

import { RootConstruct } from "constructs";
import { RegularStep, RunStep, parseExternalActionName } from "../src";
import { cleanObject } from "../src/private/utils";

describe("RunStep", () => {
  let mockScope: RootConstruct;

  beforeEach(() => {
    mockScope = new RootConstruct();
  });

  it("should initialize with given properties", () => {
    const step = new RunStep(mockScope, "step1", {
      name: "Install dependencies",
      condition: "${{ success() }}",
      timeoutMinutes: 10,
      continueOnError: false,
      env: { NODE_ENV: "production" },
      run: ["npm install"],
      workingDirectory: "src/",
      shell: "bash",
    });

    expect(step.name).toBe("Install dependencies");
    expect(step.condition).toBe("${{ success() }}");
    expect(step.timeoutMinutes).toBe(10);
    expect(step.continueOnError).toBe(false);
    expect(step.env).toEqual({ NODE_ENV: "production" });
    expect(step.run).toEqual(["npm install"]);
    expect(step.workingDirectory).toBe("src/");
    expect(step.shell).toBe("bash");
  });

  it("should serialize RunStep to record format", () => {
    const step = new RunStep(mockScope, "step1", {
      name: "Run tests",
      run: ["npm test"],
      env: { NODE_ENV: "test" },
    });

    const record = step._toRecord();

    expect(record).toEqual({
      id: "step1",
      name: "Run tests",
      if: undefined,
      run: "npm test",
      env: { NODE_ENV: "test" },
      continueOnError: undefined,
      timeoutMinutes: undefined,
      workingDirectory: undefined,
      shell: undefined,
    });
  });
});

describe("RegularStep", () => {
  let mockScope: RootConstruct;

  beforeEach(() => {
    mockScope = new RootConstruct();
  });

  it("should initialize with given properties", () => {
    const step = new RegularStep(mockScope, "step2", {
      name: "Checkout code",
      uses: "actions/checkout@v2",
      parameters: { token: "${{ secrets.GITHUB_TOKEN }}" },
    });

    expect(step.name).toBe("Checkout code");
    expect(step.uses).toBe("actions/checkout@v2");
    expect(step.parameters).toEqual({ token: "${{ secrets.GITHUB_TOKEN }}" });
  });

  it("should serialize RegularStep to record format", () => {
    const step = new RegularStep(mockScope, "step2", {
      name: "Checkout code",
      uses: "actions/checkout@v2",
      parameters: { token: "${{ secrets.GITHUB_TOKEN }}" },
    });

    const record = step._toRecord();

    expect(record).toEqual({
      id: "step2",
      name: "Checkout code",
      if: undefined,
      uses: "actions/checkout@v2",
      with: cleanObject({ token: "${{ secrets.GITHUB_TOKEN }}" }),
      env: undefined,
      continueOnError: undefined,
      timeoutMinutes: undefined,
    });
  });
});

describe("parseExternalActionName", () => {
  it("should parse a valid action name without a path", () => {
    const result = parseExternalActionName("octocat/Hello-World@main");
    expect(result).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      ref: "main",
      path: undefined,
    });
  });

  it("should parse a valid action name with a path", () => {
    const result = parseExternalActionName("octocat/Hello-World/path/to/action@v1.0");
    expect(result).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      ref: "v1.0",
      path: "path/to/action",
    });
  });

  it("should parse a valid action name with a path including slashes", () => {
    const result = parseExternalActionName("octocat/Hello-World/path/to/another/action@v1.0.0");
    expect(result).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      ref: "v1.0.0",
      path: "path/to/another/action",
    });
  });

  it("should throw an error for an invalid action name missing ref", () => {
    expect(() => parseExternalActionName("octocat/Hello-World/")).toThrow(
      "Invalid repository reference: octocat/Hello-World/",
    );
  });

  it("should throw an error for an invalid action name with invalid characters", () => {
    expect(() => parseExternalActionName("octocat/Hello-World@!invalid-ref")).toThrow(
      "Invalid repository reference: octocat/Hello-World@!invalid-ref",
    );
  });

  it("should throw an error for an invalid action name with missing owner", () => {
    expect(() => parseExternalActionName("/Hello-World@main")).toThrow(
      "Invalid repository reference: /Hello-World@main",
    );
  });

  it("should throw an error for an invalid action name with missing repo", () => {
    expect(() => parseExternalActionName("octocat/@main")).toThrow(
      "Invalid repository reference: octocat/@main",
    );
  });

  it("should throw an error for an invalid action name with no slashes", () => {
    expect(() => parseExternalActionName("invalidActionName")).toThrow(
      "Invalid repository reference: invalidActionName",
    );
  });
});

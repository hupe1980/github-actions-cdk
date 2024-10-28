// tests/step.test.ts

import { RootConstruct } from "constructs";
import { cleanObject } from "../src/private/utils"; // Ensure this utility is properly imported
import { RegularStep, RunStep } from "../src/step"; // Adjust the import path as necessary

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

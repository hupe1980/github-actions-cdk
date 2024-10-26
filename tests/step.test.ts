import { RootConstruct } from "constructs";
import { Step } from "../src"; // Adjust the path as necessary

describe("Step", () => {
  let scope: RootConstruct;

  beforeEach(() => {
    scope = new RootConstruct("TestScope"); // Mock construct scope
  });

  it("should create a step with minimal properties", () => {
    const step = new Step(scope, "TestStep", {
      name: "Install dependencies",
      run: ["npm install"],
    });

    expect(step._toObject()).toMatchSnapshot();
  });

  it("should create a step with all properties", () => {
    const step = new Step(scope, "TestStepWithAllProps", {
      name: "Build Project",
      condition: "success()",
      uses: "actions/setup-node@v2",
      parameters: { version: "14" },
      env: { NODE_ENV: "production" },
      continueOnError: true,
      timeoutMinutes: 10,
    });

    expect(step._toObject()).toMatchSnapshot();
  });

  it("should throw an error if both 'uses' and 'run' are specified", () => {
    const step = new Step(scope, "InvalidStep", {
      uses: "actions/setup-node@v2",
      run: ["npm install"],
    });

    expect(step.node.validate()).toEqual([
      "Both 'uses' and 'run' cannot be specified in the same step. Please use either 'uses' to reference an action or 'run' to execute a command, but not both.",
    ]);
  });
});

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
      if: "success()",
      uses: "actions/setup-node@v2",
      with: { version: "14" },
      env: { NODE_ENV: "production" },
      continueOnError: true,
      timeoutMinutes: 10,
    });

    expect(step._toObject()).toMatchSnapshot();
  });

  it("should throw an error if both 'uses' and 'run' are specified", () => {
    expect(() => {
      new Step(scope, "InvalidStep", {
        uses: "actions/setup-node@v2",
        run: ["npm install"],
      });
    }).toThrow("You cannot specify both uses and run in a step");
  });
});

import type { Job } from "../../src";
import { SetupNodeV4, type SetupNodeV4Props } from "../../src/actions";

describe("SetupNode", () => {
  let job: Job;
  let setupNode: SetupNodeV4;

  beforeEach(() => {
    // Mock the Job class and its methods
    job = {
      addRegularStep: jest.fn().mockReturnValue({}),
    } as unknown as Job; // Type assertion to match the Job interface

    // Create a new instance of the SetupNode class before each test
    const props: SetupNodeV4Props = {
      version: "v4",
      nodeVersion: "14.x",
      alwaysAuth: true,
      nodeVersionFile: ".nvmrc",
      architecture: "x64",
      checkLatest: true,
      registryUrl: "https://registry.npmjs.org/",
      scope: "@my-scope",
      token: "my-token",
      cache: "npm",
      cacheDependencyPath: "package-lock.json",
    };
    setupNode = new SetupNodeV4("setup-node-step", props);
  });

  test("should initialize with provided properties", () => {
    expect(setupNode.alwaysAuth).toBe(true);
    expect(setupNode.nodeVersion).toBe("14.x");
    expect(setupNode.nodeVersionFile).toBe(".nvmrc");
    expect(setupNode.architecture).toBe("x64");
    expect(setupNode.checkLatest).toBe(true);
    expect(setupNode.registryUrl).toBe("https://registry.npmjs.org/");
    expect(setupNode.scope).toBe("@my-scope");
    expect(setupNode.token).toBe("my-token");
    expect(setupNode.cache).toBe("npm");
    expect(setupNode.cacheDependencyPath).toBe("package-lock.json");
  });

  test("should bind the action to a job and add a step", () => {
    setupNode.bind(job);

    expect(job.addRegularStep).toHaveBeenCalledWith("setup-node-step", {
      name: setupNode.name,
      uses: `actions/setup-node@${setupNode.version}`,
      parameters: {
        "always-auth": setupNode.alwaysAuth,
        "node-version": setupNode.nodeVersion,
        "node-version-file": setupNode.nodeVersionFile,
        architecture: setupNode.architecture,
        "check-latest": setupNode.checkLatest,
        "registry-url": setupNode.registryUrl,
        scope: setupNode.scope,
        token: setupNode.token,
        cache: setupNode.cache,
        "cache-dependency-path": setupNode.cacheDependencyPath,
      },
    });
  });

  test("should retrieve outputs correctly", () => {
    const outputs = setupNode.outputs;

    expect(outputs.cacheHit).toBe("${{ steps.setup-node-step.outputs.cache-hit }}");
    expect(outputs.nodeVersion).toBe("${{ steps.setup-node-step.outputs.node-version }}");
  });

  test("should correctly handle optional properties", () => {
    const props: SetupNodeV4Props = {
      version: "v4",
      nodeVersion: "14.x",
      // all other properties are omitted to test defaults
    };
    const setupNodeOptional = new SetupNodeV4("setup-node-step", props);

    expect(setupNodeOptional.alwaysAuth).toBeUndefined();
    expect(setupNodeOptional.nodeVersionFile).toBeUndefined();
    expect(setupNodeOptional.architecture).toBeUndefined();
    expect(setupNodeOptional.checkLatest).toBeUndefined();
    expect(setupNodeOptional.registryUrl).toBeUndefined();
    expect(setupNodeOptional.scope).toBeUndefined();
    expect(setupNodeOptional.token).toBeUndefined();
    expect(setupNodeOptional.cache).toBeUndefined();
    expect(setupNodeOptional.cacheDependencyPath).toBeUndefined();
  });
});

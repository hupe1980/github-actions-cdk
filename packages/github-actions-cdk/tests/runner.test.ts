import { Runner } from "../src";

describe("Runner", () => {
  describe("GitHub-hosted runners", () => {
    it("should create a runner for ubuntu-latest", () => {
      const runner = Runner.UBUNTU_LATEST;
      expect(runner.runsOn).toBe("ubuntu-latest");
    });

    it("should create a runner for windows-latest", () => {
      const runner = Runner.WINDOWS_LATEST;
      expect(runner.runsOn).toBe("windows-latest");
    });

    it("should create a runner for macos-latest", () => {
      const runner = Runner.MACOS_LATEST;
      expect(runner.runsOn).toBe("macos-latest");
    });
  });

  describe("Self-hosted runners", () => {
    it("should create a self-hosted runner with one additional label", () => {
      const runner = Runner.selfHosted(["linux"]);
      expect(runner.runsOn).toEqual(["self-hosted", "linux"]);
    });

    it("should create a self-hosted runner with multiple labels", () => {
      const runner = Runner.selfHosted(["linux", "x64", "gpu"]);
      expect(runner.runsOn).toEqual(["self-hosted", "linux", "x64", "gpu"]);
    });

    it("should create a self-hosted runner that already includes self-hosted", () => {
      const runner = Runner.selfHosted(["self-hosted", "linux"]);
      expect(runner.runsOn).toEqual(["self-hosted", "linux"]);
    });

    it("should not duplicate the self-hosted label", () => {
      const runner = Runner.selfHosted(["self-hosted", "linux", "x64"]);
      expect(runner.runsOn).toEqual(["self-hosted", "linux", "x64"]);
    });
  });

  describe("RunsOn property", () => {
    it("should return a single string for GitHub-hosted runners", () => {
      const runner = Runner.UBUNTU_LATEST;
      expect(runner.runsOn).toBe("ubuntu-latest");
    });

    it("should return an array for self-hosted runners", () => {
      const runner = Runner.selfHosted(["self-hosted", "linux"]);
      expect(runner.runsOn).toEqual(["self-hosted", "linux"]);
    });
  });
});

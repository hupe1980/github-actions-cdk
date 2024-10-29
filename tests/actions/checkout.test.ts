import type { Job } from "../../src";
import { CheckoutV4, type CheckoutV4Props } from "../../src/actions";

describe("Checkout", () => {
  let job: Job;
  let checkout: CheckoutV4;

  beforeEach(() => {
    // Mock the Job class and its methods
    job = {
      addRegularStep: jest.fn().mockReturnValue({}),
    } as unknown as Job; // Type assertion to match the Job interface

    // Create a new instance of the Checkout class before each test
    const props: CheckoutV4Props = {
      version: "v4",
      repository: "actions/checkout",
      ref: "main",
      token: "test-token",
      sshKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...",
      sshKnownHosts: "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...",
      sshStrict: true,
      sshUser: "git",
      persistCredentials: true,
      path: "./repo",
      clean: true,
      fetchDepth: 1,
      fetchTags: true,
      showProgress: true,
      lfs: false,
      submodules: false,
      setSafeDirectory: true,
      githubServerUrl: "https://github.com",
    };
    checkout = new CheckoutV4("checkout-step", props);
  });

  test("should initialize with provided properties", () => {
    expect(checkout.repository).toBe("actions/checkout");
    expect(checkout.ref).toBe("main");
    expect(checkout.token).toBe("test-token");
    expect(checkout.sshKey).toBe("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...");
    expect(checkout.sshKnownHosts).toBe("github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...");
    expect(checkout.sshStrict).toBe(true);
    expect(checkout.sshUser).toBe("git");
    expect(checkout.persistCredentials).toBe(true);
    expect(checkout.path).toBe("./repo");
    expect(checkout.clean).toBe(true);
    expect(checkout.fetchDepth).toBe(1);
    expect(checkout.fetchTags).toBe(true);
    expect(checkout.showProgress).toBe(true);
    expect(checkout.lfs).toBe(false);
    expect(checkout.submodules).toBe(false);
    expect(checkout.setSafeDirectory).toBe(true);
    expect(checkout.githubServerUrl).toBe("https://github.com");
  });

  test("should bind the action to a job and add a step", () => {
    checkout.bind(job);

    expect(job.addRegularStep).toHaveBeenCalledWith("checkout-step", {
      name: checkout.name,
      uses: `actions/checkout@${checkout.version}`,
      parameters: {
        repository: checkout.repository,
        ref: checkout.ref,
        token: checkout.token,
        "ssh-key": checkout.sshKey,
        "ssh-known-hosts": checkout.sshKnownHosts,
        "ssh-strict": checkout.sshStrict,
        "ssh-user": checkout.sshUser,
        "persist-credentials": checkout.persistCredentials,
        path: checkout.path,
        clean: checkout.clean,
        filter: undefined, // Not set in the props
        "sparse-checkout": undefined, // Not set in the props
        "sparse-checkout-cone-mode": undefined, // Not set in the props
        "fetch-depth": checkout.fetchDepth,
        "fetch-tags": checkout.fetchTags,
        "show-progress": checkout.showProgress,
        lfs: checkout.lfs,
        submodules: checkout.submodules,
        "set-safe-directory": checkout.setSafeDirectory,
        "github-server-url": checkout.githubServerUrl,
      },
    });
  });

  test("should retrieve outputs correctly", () => {
    const outputs = checkout.outputs;

    expect(outputs.ref).toBe("${{ steps.checkout-step.outputs.ref }}");
    expect(outputs.commit).toBe("${{ steps.checkout-step.outputs.commit }}");
  });
});

/**
 * Defines the permissions granted to a job or workflow.
 *
 * Permissions can be set globally to `"read-all"` or `"write-all"`, granting
 * all scopes with read or write access respectively. Alternatively, specific
 * scopes can be configured via `PermissionsEvent`, allowing fine-grained
 * control over individual access levels.
 */
export type Permissions = "read-all" | "write-all" | PermissionsEvent;

/**
 * Specifies detailed permission levels for individual GitHub resources in a workflow.
 *
 * Each property in `PermissionsEvent` represents a specific scope for which
 * access can be configured. When any scope is specified, all unspecified scopes
 * are set to `PermissionLevel.NONE`, overriding the default GitHub behavior
 * of automatically setting unspecified permissions to `read` or `write`.
 */
export interface PermissionsEvent {
  /** Permissions for GitHub Actions, affecting access to workflows. */
  readonly actions?: PermissionLevel;

  /** Permissions for check runs, enabling read or write access to check details. */
  readonly checks?: PermissionLevel;

  /** Permissions for repository contents, controlling file and directory access. */
  readonly contents?: PermissionLevel;

  /** Permissions for deployments, affecting environment deployments in the repository. */
  readonly deployments?: PermissionLevel;

  /** Permissions for the GitHub OIDC (OpenID Connect) token, allowing secure identity verification. */
  readonly idToken?: PermissionLevel;

  /** Permissions for managing and interacting with issues in the repository. */
  readonly issues?: PermissionLevel;

  /** Permissions for discussions, enabling interaction with GitHub Discussions. */
  readonly discussions?: PermissionLevel;

  /** Permissions for packages in the GitHub Packages registry. */
  readonly packages?: PermissionLevel;

  /** Permissions for interacting with pull requests in the repository. */
  readonly pullRequests?: PermissionLevel;

  /** Permissions for repository projects, affecting project boards and related assets. */
  readonly repositoryProjects?: PermissionLevel;

  /** Permissions for security events, such as vulnerability alerts. */
  readonly securityEvents?: PermissionLevel;

  /** Permissions for statuses, affecting commit statuses in the repository. */
  readonly statuses?: PermissionLevel;
}

/**
 * Access levels for specific workflow permission scopes.
 *
 * `PermissionLevel` defines the different levels of access available for
 * each permission scope in a workflow. These levels determine the
 * degree of interaction that GitHub Actions workflows have with repository
 * resources.
 */
export enum PermissionLevel {
  /** Grants read-only access to the specified scope. */
  READ = "read",

  /** Grants both read and write access to the specified scope. */
  WRITE = "write",

  /** Explicitly denies all access to the specified scope. */
  NONE = "none",
}

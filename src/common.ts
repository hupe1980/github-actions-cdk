/**
 * List of supported shell types for use in the application.
 *
 * `validShells` defines a tuple of shell types that are compatible
 * with various runtime environments in the application. Specifying
 * shell types in this tuple allows for type safety and enforces immutability.
 *
 * Supported shells include:
 * - `bash`: Bash shell, commonly used in Unix-based systems.
 * - `sh`: Basic shell, also widely supported in Unix-like systems.
 * - `python`: Python shell, for executing Python commands directly.
 * - `cmd`: Command Prompt, available in Windows environments.
 * - `pwsh`: PowerShell Core, a cross-platform PowerShell environment.
 * - `powershell`: Classic PowerShell, typically available on Windows.
 *
 * By using `as const`, this array is locked as a readonly tuple to ensure
 * immutability and precise typing.
 */
export const validShells = ["bash", "sh", "python", "cmd", "pwsh", "powershell"] as const;

/**
 * Represents a type of shell that can be used in the application.
 *
 * `ShellType` is derived from the values in `validShells`, allowing
 * only the listed shells to be used. This type definition ensures that
 * any shell references within the application are limited to known,
 * validated shell types, increasing reliability and preventing
 * potential runtime errors from unsupported shell types.
 */
export type ShellType = (typeof validShells)[number];

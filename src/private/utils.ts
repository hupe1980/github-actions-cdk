import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Converts a camelCase string to snake_case.
 *
 * @param str - The camelCase string to be converted.
 * @param options - Optional configuration object.
 * @param options.separator - The separator to use between words. Defaults to "_".
 * @returns The snake_case representation of the input string.
 */
export function decamelize(str: string, options: { separator?: string } = {}): string {
  const separator = options.separator || "_";
  return str
    .replace(/([a-z\d])([A-Z])/g, `$1${separator}$2`)
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, `$1${separator}$2`)
    .toLowerCase();
}

/**
 * Converts the keys of an object to snake_case.
 *
 * @param obj - The object whose keys are to be converted. Can be nested and may include arrays.
 * @param sep - The separator to use between words in the keys. Defaults to "-".
 * @returns A new object with keys in snake_case format, or the original value if not an object.
 */
export function snakeCaseKeys<T>(obj: T, sep = "-"): T {
  if (typeof obj !== "object" || obj == null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((o) => snakeCaseKeys(o, sep)) as T;
  }

  const result: Record<string, unknown> = {};
  for (let [k, v] of Object.entries(obj)) {
    // We don't want to snake case environment variables
    if (k !== "env" && typeof v === "object" && v != null) {
      v = snakeCaseKeys(v, sep);
    }
    result[decamelize(k, { separator: sep })] = v;
  }
  return result as T;
}

/**
 * Ensures that a directory exists, creating it if necessary.
 *
 * @param outdir - The path to the directory to check or create.
 */
export function ensureDirSync(outdir: string): void {
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, { recursive: true });
  }
}

/**
 * Cleans an object by removing keys with undefined values.
 *
 * @param obj - The object to be cleaned. If undefined, returns undefined.
 * @returns A new object without undefined values, or undefined if the cleaned object is empty or the input is undefined.
 */
export function cleanObject<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (obj === undefined) {
    return undefined;
  }

  const cleanedObj: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (cleanedObj as Record<string, unknown>)[key] = value;
    }
  }

  return Object.keys(cleanedObj).length > 0 ? (cleanedObj as T) : undefined;
}

/**
 * Retrieves the version from the package.json file.
 *
 * @returns The version string from package.json if it exists, otherwise undefined.
 */
export function getPackageVersion(): string | undefined {
  const packageJsonPath = path.resolve(__dirname, "../../package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  }
  return undefined;
}

/**
 * Utility function to check if a value is an object.
 *
 * @param value - The value to check.
 * @returns True if the value is an object, false otherwise.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

import * as path from "node:path";

/**
 * Converts a given path to POSIX format (using forward slashes).
 *
 * @param p - The input path.
 * @returns The path in POSIX format.
 */
export function posixPath(p: string) {
  return p.split(path.sep).join(path.posix.sep);
}

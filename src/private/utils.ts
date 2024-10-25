import * as fs from "node:fs";

export function decamelize(
	str: string,
	options: { separator?: string } = {},
): string {
	const separator = options.separator || "_";
	return str
		.replace(/([a-z\d])([A-Z])/g, `$1${separator}$2`)
		.replace(/([A-Z]+)([A-Z][a-z\d]+)/g, `$1${separator}$2`)
		.toLowerCase();
}

export function snakeCaseKeys<T>(obj: T, sep = "-"): T {
	if (typeof obj !== "object" || obj == null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((o) => snakeCaseKeys(o, sep)) as T;
	}

	const result: Record<string, unknown> = {};
	for (let [k, v] of Object.entries(obj)) {
		// we don't want to snake case environment variables
		if (k !== "env" && typeof v === "object" && v != null) {
			v = snakeCaseKeys(v, sep);
		}
		result[decamelize(k, { separator: sep })] = v;
	}
	return result as T;
}

export function ensureDirSync(outdir: string): void {
	if (!fs.existsSync(outdir)) {
		fs.mkdirSync(outdir, { recursive: true });
	}
}

export function cleanObject<T extends Record<string, unknown>>(
	obj?: T,
): T | undefined {
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

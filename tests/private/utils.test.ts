import * as fs from "node:fs";
import * as path from "node:path";
import { cleanObject, decamelize, getPackageVersion, snakeCaseKeys } from "../../src/private/utils";

describe("decamelize", () => {
  it("should convert camelCase to snake_case", () => {
    expect(decamelize("camelCase")).toBe("camel_case");
    expect(decamelize("myVariableName")).toBe("my_variable_name");
    expect(decamelize("HTTPResponse")).toBe("http_response");
  });

  it("should convert camelCase to snake-case with custom separator", () => {
    expect(decamelize("camelCase", { separator: "-" })).toBe("camel-case");
    expect(decamelize("myVariableName", { separator: "*" })).toBe("my*variable*name");
  });

  it("should return the same string if no camel case is present", () => {
    expect(decamelize("already_snake_case")).toBe("already_snake_case");
    expect(decamelize("")).toBe("");
  });
});

describe("snakeCaseKeys", () => {
  it("should convert object keys to snake_case", () => {
    const input = { myVariableName: "value", anotherKey: "anotherValue" };
    const expected = { "my-variable-name": "value", "another-key": "anotherValue" };
    expect(snakeCaseKeys(input)).toEqual(expected);
  });

  it("should handle nested objects", () => {
    const input = { myVariableName: { nestedKey: "value" }, anotherKey: "anotherValue" };
    const expected = {
      "my-variable-name": { "nested-key": "value" },
      "another-key": "anotherValue",
    };
    expect(snakeCaseKeys(input)).toEqual(expected);
  });

  it('should ignore the "env" key', () => {
    const input = { myVariableName: "value", env: { FOO_BAR: "should be ignored" } };
    const expected = { "my-variable-name": "value", env: { FOO_BAR: "should be ignored" } };
    expect(snakeCaseKeys(input)).toEqual(expected);
  });

  it("should handle arrays", () => {
    const input = [{ myVariableName: "value" }, { anotherKey: "anotherValue" }];
    const expected = [{ "my-variable-name": "value" }, { "another-key": "anotherValue" }];
    expect(snakeCaseKeys(input)).toEqual(expected);
  });

  it("should return the input if it is not an object", () => {
    expect(snakeCaseKeys(null)).toBeNull();
    expect(snakeCaseKeys("string")).toBe("string");
    expect(snakeCaseKeys(123)).toBe(123);
  });
});

describe("cleanObject", () => {
  it("should remove keys with undefined values", () => {
    const input = { key1: "value1", key2: undefined, key3: "value3" };
    const expected = { key1: "value1", key3: "value3" };
    expect(cleanObject(input)).toEqual(expected);
  });

  it("should return undefined if all values are undefined", () => {
    const input = { key1: undefined, key2: undefined };
    expect(cleanObject(input)).toBeUndefined();
  });

  it("should return the same object if there are no undefined values", () => {
    const input = { key1: "value1", key2: "value2" };
    expect(cleanObject(input)).toEqual(input);
  });

  it("should return undefined if the input object is undefined", () => {
    expect(cleanObject(undefined)).toBeUndefined();
  });

  it("should handle empty objects", () => {
    expect(cleanObject({})).toBeUndefined();
  });
});

describe("getPackageVersion", () => {
  const mockPackageJsonPath = path.resolve(__dirname, "../../package.json");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the version from package.json when it exists", () => {
    const mockVersion = "1.2.3";
    const mockPackageJson = JSON.stringify({ version: mockVersion });

    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    const version = getPackageVersion();

    expect(version).toBe(mockVersion);
    expect(fs.existsSync).toHaveBeenCalledWith(mockPackageJsonPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockPackageJsonPath, "utf-8");
  });

  it("should return undefined when package.json does not contain a version", () => {
    const mockPackageJson = JSON.stringify({});

    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockReturnValue(mockPackageJson);

    const version = getPackageVersion();

    expect(version).toBeUndefined();
    expect(fs.existsSync).toHaveBeenCalledWith(mockPackageJsonPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockPackageJsonPath, "utf-8");
  });

  it("should return undefined when package.json does not exist", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    const version = getPackageVersion();

    expect(version).toBeUndefined();
    expect(fs.existsSync).toHaveBeenCalledWith(mockPackageJsonPath);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
